import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini AI
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Helper function for normalizing label weight
  function normalizeWeight(rawWeight: string | number | null | undefined): { weight: number | null; unsure: boolean } {
    if (rawWeight === null || rawWeight === undefined || rawWeight === "") {
      return { weight: null, unsure: true };
    }
    const str = String(rawWeight).trim().replace(",", ".");
    const match = str.match(/\d+(\.\d+)?/);
    if (!match) return { weight: null, unsure: true };

    let val = parseFloat(match[0]);
    let unsure = false;
    if (val >= 100 && val <= 999 && !str.includes(".")) {
      val = val / 10;
      unsure = true;
    }
    if (val < 5 || val > 35) {
      unsure = true;
    }
    return { weight: Math.round(val * 10) / 10, unsure };
  }

  function extractBagNumber(taraStr: string): number | null {
    if (!taraStr) return null;
    const parts = taraStr.split(/[\/\\|]/);
    if (parts.length > 0) {
      const num = parseInt(parts[0].replace(/\D/g, ""), 10);
      if (!isNaN(num)) return num;
    }
    const fallback = parseInt(taraStr.replace(/\D/g, ""), 10);
    return isNaN(fallback) ? null : fallback;
  }

  // API endpoint for reading bag label markirovka
  app.post("/api/labels/read", async (req, res) => {
    try {
      const { image, fileName, mimeType, taraExtract = true } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, error: "Rasm yuborilmadi" });
      }

      const warnings: string[] = [];

      if (!ai) {
        const bagNum = Math.floor(Math.random() * 25) + 1;
        const weights = [13.5, 14.2, 18.7, 19.4, 21.0, 16.8];
        const randomWeight = weights[Math.floor(Math.random() * weights.length)];
        return res.json({
          success: true,
          tara_raw: `${bagNum} / V2`,
          bag_number: bagNum,
          order_number: "MOS-509.3",
          product_name: "Фуфайка (футболка) мужская",
          model_code: "SM-1111/150-BK (брак)",
          colors: [
            { color: "Белый", qty: 50 },
            { color: "Черный", qty: 20 },
          ],
          gross_weight: randomWeight,
          weight_unsure: false,
          detection_method: "fallback",
          notes: "Gemini API kaliti yo'qligi sababli namuna natija qaytarildi",
          warnings: ["Oflayn tahlil: Sinov ma'lumoti yaratildi."],
        });
      }

      let base64Content = image;
      if (image.includes(",")) {
        base64Content = image.split(",")[1];
      }

      const prompt = `Sen Chust Textile tikuvchilik fabrikasi tayyor mahsulotlar ombori markirovka yorlig'ini (qop etiketkasi) o'quvchi AI mutaxassisisan.
Suratda qop ustidagi bosma etiketka va qopga FLOMASTER BILAN QO'LDA YOZILGAN brutto vazn bor.
Quyidagi maydonlarni aniq chiqarib JSON formatda ber:
1. "tara": masalan "2 / V2", "16 / V2".
2. "order": "Номер заказа", masalan "MOS-509.3".
3. "name": "Наименование", masalan "Фуфайка (футболка) мужская".
4. "model": Yorliq chetidagi VERTIKAL yozuv, masalan "SM-1111/150-BK (брак)".
5. "colors": Ranglar va ularning miqdori. Masalan [{"color": "Белый", "qty": 50}, {"color": "Черный", "qty": 20}].
6. "weight": QOP USTIGA QO'LDA FLOMASTER BILAN YOZILGAN BRUTTO VAZN RAQAMI (masalan "13.5", "19.4"). Agar 194 deb nuqtasiz yozilgan bo'lsa "19.4" deb ber.
7. "weight_unsure": Vazn noaniq yoki qiyin o'qilsa true, aks holda false.

Format:
{
  "tara": "2 / V2",
  "order": "MOS-509.3",
  "name": "Фуфайка (футболка) мужская",
  "model": "SM-1111/150-BK (брак)",
  "colors": [{"color": "Белый", "qty": 50}],
  "weight": "19.4",
  "weight_unsure": false,
  "notes": ""
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Content,
            },
          },
          { text: prompt },
        ],
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const rawJson = response.text || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(rawJson);
      } catch (e) {
        const cleaned = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      }

      const taraRaw = parsed.tara || "";
      const bagNum = taraExtract ? extractBagNumber(taraRaw) : null;
      let orderNum = parsed.order || "";
      const orderMatch = orderNum.toUpperCase().match(/M[O0Q][S5$]\s*[-–—]?\s*(\d{3})\s*[.,]\s*(\d{1,2})/);
      if (orderMatch) {
        orderNum = `MOS-${orderMatch[1]}.${orderMatch[2]}`;
      }

      const { weight, unsure } = normalizeWeight(parsed.weight);

      const colorsList = Array.isArray(parsed.colors) && parsed.colors.length > 0
        ? parsed.colors.map((c: any) => ({
            color: String(c.color || "Standart").trim(),
            qty: parseInt(String(c.qty || 0), 10) || 0,
          }))
        : [{ color: "Standart", qty: 50 }];

      if (!orderNum) warnings.push("Buyurtma kodi (MOS) aniqlanmadi");
      if (!taraRaw) warnings.push("Tara raqami topilmadi");
      if (weight === null) warnings.push("Qo'lda yozilgan vazn topilmadi");
      else if (unsure) warnings.push(`Vazn (${weight} kg) shubhali ko'rinadi`);

      res.json({
        success: true,
        tara_raw: taraRaw,
        bag_number: bagNum,
        order_number: orderNum,
        product_name: parsed.name || "Фуфайка (футболка) мужская",
        model_code: parsed.model || "",
        colors: colorsList,
        gross_weight: weight,
        weight_unsure: unsure || parsed.weight_unsure,
        detection_method: "gemini",
        notes: parsed.notes || "",
        warnings,
      });

    } catch (err: any) {
      console.error("API /api/labels/read error:", err);
      res.status(500).json({
        success: false,
        error: "Markirovkani o'qishda xatolik: " + err.message,
      });
    }
  });

  // API endpoint for Textile Smart Advisor
  app.post("/api/ai/advise", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt yuborilmadi" });
      }

      if (!ai) {
        return res.json({ 
          text: "⚠️ **Gemini API kaliti topilmadi.** Tizim hozircha oflayn rejimda ishlamoqda. AI bilan maslahatlashish uchun Secrets panelida `GEMINI_API_KEY` o'rnating.\n\n**Standart To'qimachilik Mato Sarfi Ko'rsatkichlari (Ma'lumot):**\n\n1. **T-Shirt (Futbolka):**\n   - Mato: *Suprem 160g-180g*\n   - O'rtacha og'irligi: 150 - 180 gr (bitta kiyim uchun).\n   - 1000 dona uchun: 160-180 kg mato + 10% bichuv chiqindisi (jami: ~180-200 kg).\n\n2. **Polo (Yoqali futbolka):**\n   - Mato: *Pike (Lakos) 200g-220g*\n   - O'rtacha og'irligi: 220 - 250 gr.\n   - Jami: ~250 kg mato (1000 dona uchun) + yoqa manzhetlari (~35 kg Ribana).\n\n3. **Hoodie (Xudi):**\n   - Mato: *Futra 3-iplik 320g*\n   - O'rtacha og'irligi: 450 - 550 gr.\n   - 1000 dona uchun: 500-550 kg mato (chiqindi bilan)."
        });
      }

      const systemInstruction = `Siz To'qimachilik va tikuvchilik sanoati bo'yicha yuqori malakali ekspert, texnolog va maslahatchisiz. 
Ismingiz "Tex ERP Smart Advisor". Siz foydalanuvchilarga mato sarfini hisoblash, tikuvchilik buyurtmalarini rejalashtirish, iplar sifati (masalan, Ne 30/1, Carded, Combed, Open End), ranglarni tanlash, va ishlab chiqarish jarayonini optimallashtirish bo'yicha professional maslahatlar berasiz.
Muloqot tili: O'zbek tili (tabiiy, texnik jihatdan to'g'ri va professional).

Mavjud mato turlari va andozalari haqida ma'lumot:
1. Suprem (100% Paxta, 160g) - yozgi futbolkalar uchun eng keng tarqalgan mato. Bitta futbolka uchun o'rtacha 0.16kg - 0.18kg ketadi.
2. Suprem Laykra (95% Paxta, 5% Laykra, 180g) - cho'ziluvchan, sifatli futbolkalar uchun. Bitta kiyimga 0.18kg - 0.20kg.
3. Interlok (220g) - bolalar kiyimlari va sifatli kiyimlar uchun ikki tomonlama silliq mato. Bitta bolalar kombinezoniga 0.12kg - 0.15kg.
4. Pike (Lakos, 200g) - Polo futbolkalar uchun g'ovakli mato. Bitta pologa 0.22kg - 0.25kg ketadi.
5. Futra 2-iplik (240g) - yupqaroq sviter, sport shimlari uchun. Bitta shimga 0.32kg - 0.38kg ketadi.
6. Futra 3-iplik (320g) - qalin, nachesli xudilar (hoodie) va qishki sviterlar uchun. Bitta xudiga 0.48kg - 0.55kg ketadi.

Maslahat berayotganda mato yo'qotishi (bichuv chiqindisi, odatda 8-12% oralig'ida) va texnologik jarayonlarni (bichish, tikish, dazmollash, qadoqlash) ham hisobga oling. Foydalanuvchining savoliga qarab aniq hisob-kitoblar ko'rsatib bering.
Hozirgi tizim holati (buyurtmalar va ombor): ${JSON.stringify(context || {})}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: "AI so'rovida xatolik yuz berdi: " + error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
