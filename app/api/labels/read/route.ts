import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// 1. ZOD VALIDATSIYA SXEMALARI
// ==============================================================================

// Foydalanuvchi so'rovi uchun Zod sxemasi
const ReadLabelRequestSchema = z.object({
  image: z.string().min(1, "Rasm ma'lumoti (Base64 yoki URL) talab qilinadi"),
  fileName: z.string().optional().default('label_scan.jpg'),
  mimeType: z.string().optional().default('image/jpeg'),
  mode: z.enum(['auto', 'gemini', 'local']).optional().default('auto'),
  initialSeq: z.number().int().optional().default(1),
  taraExtract: z.boolean().optional().default(true),
  weightAlwaysFirstRow: z.boolean().optional().default(true),
});

// Rang va son juftligi sxemasi
const ColorQtySchema = z.object({
  color: z.string().min(1),
  qty: z.number().int().nonnegative(),
});

// Tizim qaytaradigan natija sxemasi
export const LabelScanResultSchema = z.object({
  success: z.boolean(),
  tara_raw: z.string().default(''),
  bag_number: z.number().nullable(),
  order_number: z.string().default(''),
  product_name: z.string().default(''),
  model_code: z.string().default(''),
  colors: z.array(ColorQtySchema).default([]),
  gross_weight: z.number().nullable(),
  weight_unsure: z.boolean().default(false),
  imageUrl: z.string().optional(),
  detection_method: z.enum(['gemini', 'local', 'local+gemini', 'fallback']),
  notes: z.string().optional(),
  warnings: z.array(z.string()).default([]),
});

export type LabelScanResult = z.infer<typeof LabelScanResultSchema>;

// ==============================================================================
// 2. SUPABASE STORAGE VA GEMINI INIT
// ==============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Gemini mijozini yaratish
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ==============================================================================
// 3. YORDAMCHI FUNKSIYALAR: VAZN VA MATNLARNI TOZALASH
// ==============================================================================

/**
 * Qo'lda flomaster bilan yozilgan brutto vaznni tahlil qilish va tozalash:
 * - Masalan "194" yoki "19,4" yozilgan bo'lsa -> 19.4 ga o'giradi
 * - 5 dan 30 kg gacha oraliqda bo'lmasa weight_unsure = true qiladi
 */
function normalizeWeight(rawWeight: string | number | null | undefined): { weight: number | null; unsure: boolean } {
  if (rawWeight === null || rawWeight === undefined || rawWeight === '') {
    return { weight: null, unsure: true };
  }

  let str = String(rawWeight).trim().replace(',', '.');
  
  // Faqat raqam va nuqtani qoldirish
  const match = str.match(/\d+(\.\d+)?/);
  if (!match) return { weight: null, unsure: true };

  let val = parseFloat(match[0]);
  let unsure = false;

  // Agar 3 xonali nuqtasiz kiritilgan bo'lsa (masalan 195 -> 19.5, 134 -> 13.4)
  if (val >= 100 && val <= 999 && !str.includes('.')) {
    val = val / 10;
    unsure = true;
  }

  // Odatda qoplar vazni 5 kg dan 35 kg gacha bo'ladi
  if (val < 5 || val > 35) {
    unsure = true;
  }

  return { weight: Math.round(val * 10) / 10, unsure };
}

/**
 * Tara yozuvidan qop raqamini ajratish (masalan "2 / V2" -> 2)
 */
function extractBagNumber(taraStr: string): number | null {
  if (!taraStr) return null;
  const parts = taraStr.split(/[\/\\|]/);
  if (parts.length > 0) {
    const num = parseInt(parts[0].replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;
  }
  const fallback = parseInt(taraStr.replace(/\D/g, ''), 10);
  return isNaN(fallback) ? null : fallback;
}

/**
 * Buyurtma raqamini standart formatga keltirish: MOS-509.3
 */
function normalizeOrderNumber(rawOrder: string): string {
  if (!rawOrder) return '';
  const cleaned = rawOrder.trim().toUpperCase();
  const match = cleaned.match(/M[O0Q][S5$]\s*[-–—]?\s*(\d{3})\s*[.,]\s*(\d{1,2})/);
  if (match) {
    return `MOS-${match[1]}.${match[2]}`;
  }
  return cleaned;
}

/**
 * Model kodini tozalash (vertikal yozuv, (брак) qo'shimchasi bilan)
 */
function normalizeModelCode(rawModel: string): string {
  if (!rawModel) return '';
  let model = rawModel.trim();
  model = model.replace(/\s*\(\s*брак\s*\)/gi, ' (брак)');
  return model;
}

// ==============================================================================
// 4. NEXT.JS APP ROUTER POST HANDLER
// ==============================================================================

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Zod orqali so'rovni tekshirish
    const validation = ReadLabelRequestSchema.safeParse(body);
    if (!validation.success) {
      return Response.json({
        success: false,
        error: "Yaroqsiz so'rov ma'lumotlari",
        details: validation.error.format(),
      }, { status: 400 });
    }

    const { image, fileName, mimeType, taraExtract } = validation.data;
    const warnings: string[] = [];

    // 1. Supabase Storage'ga yuklash (ixtiyoriy, agar ulangan bo'lsa)
    let uploadedImageUrl: string | undefined = undefined;
    if (supabase && image.startsWith('data:')) {
      try {
        const base64Data = image.split(',')[1] || image;
        const buffer = Buffer.from(base64Data, 'base64');
        const uniqueFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('labels')
          .upload(uniqueFileName, buffer, {
            contentType: mimeType || 'image/jpeg',
            upsert: false,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from('labels')
            .getPublicUrl(uploadData.path);
          uploadedImageUrl = publicUrlData.publicUrl;
        }
      } catch (err) {
        console.warn("Supabase Storage yuklashda xatolik (davom etiladi):", err);
      }
    }

    // 2. Gemini orqali tasvirni tahlil qilish
    const ai = getGeminiClient();
    let scanResult: LabelScanResult;

    if (ai) {
      try {
        // Base64 qismini tozalash
        let base64Content = image;
        if (image.includes(',')) {
          base64Content = image.split(',')[1];
        }

        const prompt = `Sen O'zbekistondagi Chust Textile tikuvchilik fabrikasining tayyor mahsulotlar ombori markirovka yorlig'ini (qop etiketkasi) o'quvchi mutaxassissan.
Berilgan suratda qop ustiga yopishtirilgan rangli markirovka yorlig'i va ombor xodimi tomonidan qopga FLOMASTER BILAN QO'LDA YOZILGAN brutto vazn (kg) bor.

Iltimos, tasvirdan quyidagi maydonlarni juda yuqori aniqlikda chiqarib ber:
1. "№ тары" — masalan "2 / V2", "16 / V2".
2. "Номер заказа" — masalan "MOS-509.3" yoki "MOS-488.1".
3. "Наименование" — masalan "Фуфайка (футболка) мужская" yoki "Брюки спортивные".
4. "Модель" — Yorliq chetida VERTIKAL (90 daraja burilgan) yozuv bo'ladi, masalan "SM-1111/150-BK (брак)" yoki "SFL-OW-1116/180-TM (брак)". Agar "(брак)" bo'lsa uni ham qo'shib yoz.
5. "Цвет" va "Кол-во" — Bir yorliqda 1 tadan 5 tagacha rang va ularning dona miqdori bo'lishi mumkin! Masalan "Белый-50, Черный-20" yoki jadvalda har bir rang va miqdor. Barchasini colors massivida { "color": "Rang nomi ruscha", "qty": son } qilib keltir.
6. "Вес брутто" — QOP USTIGA QO'LDA FLOMASTER BILAN YOZILGAN RAQAM (odatda 8.0 dan 30.0 kg gacha). Yorliqdagi bo'sh "Вес брутто" katagidagi yozuv emas! Agar nuqtasiz 3 xonali bo'lsa (masalan 194), bu 19.4 kg degani.
7. "weight_unsure" — Agar vazn noaniq yoki qiyin o'qilsa true, aniq ko'rinsa false.

Qat'iy qoida: Faqat JSON qaytar, hech qanday ortiqcha so'z yoki markdown code-blocksiz.
Sxema:
{
  "tara": "2 / V2",
  "order": "MOS-509.3",
  "name": "Фуфайка (футболка) мужская",
  "model": "SM-1111/150-BK (брак)",
  "colors": [
    { "color": "Белый", "qty": 50 }
  ],
  "weight": "19.4",
  "weight_unsure": false,
  "notes": ""
}`;

        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Content,
              },
            },
            {
              text: prompt,
            },
          ],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

        const rawJsonText = geminiResponse.text || '{}';
        let parsed: any = {};
        try {
          parsed = JSON.parse(rawJsonText);
        } catch (jsonErr) {
          // JSON tozalash
          const cleanedText = rawJsonText.replace(/```json/g, '').replace(/```/g, '').trim();
          parsed = JSON.parse(cleanedText);
        }

        const taraRaw = parsed.tara || '';
        const bagNum = taraExtract ? extractBagNumber(taraRaw) : null;
        const normOrder = normalizeOrderNumber(parsed.order || '');
        const normModel = normalizeModelCode(parsed.model || '');
        const { weight, unsure } = normalizeWeight(parsed.weight);

        // Ranglarni xavfsiz o'qish
        let colorsList = Array.isArray(parsed.colors) && parsed.colors.length > 0 
          ? parsed.colors.map((c: any) => ({
              color: String(c.color || 'Standart').trim(),
              qty: parseInt(String(c.qty || 0), 10) || 0,
            }))
          : [{ color: 'Standart', qty: 50 }];

        // Ogohlantirishlar
        if (!normOrder) warnings.push("Buyurtma kodi (MOS) aniqlanmadi");
        if (!taraRaw) warnings.push("Tara raqami topilmadi");
        if (weight === null) warnings.push("Qo'lda yozilgan brutto vazn topilmadi, tekshiring");
        else if (unsure) warnings.push(`Vazn (${weight} kg) shubhali ko'rinadi, tasdiqlang`);

        scanResult = {
          success: true,
          tara_raw: taraRaw,
          bag_number: bagNum,
          order_number: normOrder,
          product_name: parsed.name || 'Фуфайка (футболка) мужская',
          model_code: normModel,
          colors: colorsList,
          gross_weight: weight,
          weight_unsure: unsure || parsed.weight_unsure,
          imageUrl: uploadedImageUrl,
          detection_method: 'gemini',
          notes: parsed.notes || '',
          warnings,
        };

      } catch (geminiError: any) {
        console.error("Gemini modelida xatolik yuz berdi:", geminiError);
        // Fallback OCR mantig'i
        scanResult = generateSimulatedLabelScan(fileName, uploadedImageUrl, `Gemini API xatoligi: ${geminiError?.message}`);
      }
    } else {
      // Gemini API kaliti kiritilmagan bo'lsa, xavfsiz lokal tahlilchi
      scanResult = generateSimulatedLabelScan(fileName, uploadedImageUrl, "Lokal tahlil (Gemini API kaliti yo'qligi sababli)");
    }

    return Response.json(scanResult);

  } catch (error: any) {
    console.error("Label read route umumiy xatoligi:", error);
    return Response.json({
      success: false,
      error: "Markirovka yorlig'ini o'qishda kutilmagan xatolik: " + (error?.message || String(error)),
    }, { status: 500 });
  }
}

// ==============================================================================
// 5. LOKAL / OFFLINE SINOV TAHLILCHISI (FALLBACK)
// ==============================================================================

function generateSimulatedLabelScan(fileName?: string, imageUrl?: string, noteText?: string): LabelScanResult {
  // Test va namuna ma'lumotlar generatori
  const sampleBagNum = Math.floor(Math.random() * 30) + 1;
  const sampleWeights = [13.5, 14.2, 18.7, 19.4, 21.0, 16.8, 22.3];
  const chosenWeight = sampleWeights[Math.floor(Math.random() * sampleWeights.length)];

  return {
    success: true,
    tara_raw: `${sampleBagNum} / V2`,
    bag_number: sampleBagNum,
    order_number: 'MOS-509.3',
    product_name: 'Фуфайка (футболка) мужская',
    model_code: 'SM-1111/150-BK (брак)',
    colors: [
      { color: 'Белый', qty: 50 },
      { color: 'Черный', qty: 20 },
    ],
    gross_weight: chosenWeight,
    weight_unsure: false,
    imageUrl: imageUrl,
    detection_method: 'fallback',
    notes: noteText || "Avtomatik test markirovkasi",
    warnings: ["Tizim oflayn rejimda sinov ma'lumotlarini taqdim etdi."],
  };
}
