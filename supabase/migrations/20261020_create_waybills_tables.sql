-- ==============================================================================
-- CHUST TEXTILE ERP: NAKLADNOY VA MARKIROVKA TIZIMI (WAYBILLS) MIGRATSIYA FAYLI
-- Sana: 2026-10-20
-- Tavsif: Tayyor mahsulotlar ombori uchun markirovka (qop yorliqlari) o'qish,
--         yuk xati (nakladnaya) va uning tarkibidagi tovarlarni saqlash sxemasi.
-- ==============================================================================

-- 1. Storage bucket: Markirovka rasmlarini saqlash uchun 'labels' papkasi
INSERT INTO storage.buckets (id, name, public)
VALUES ('labels', 'labels', true)
ON CONFLICT (id) DO NOTHING;

-- Storage uchun RLS qoidalari (Hamma rasm yuklashi va o'qishi mumkin)
CREATE POLICY "Markirovka rasmlarini hamma ko'rishi mumkin"
ON storage.objects FOR SELECT
USING (bucket_id = 'labels');

CREATE POLICY "Markirovka rasmlarini yuklashga ruxsat"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'labels');

-- 2. Nakladnoy (Yuk xati) asosiy jadvali: waybills
CREATE TABLE IF NOT EXISTS public.waybills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_number VARCHAR(64) NOT NULL,                    -- Nakladnoy raqami, masalan: "№ 1042"
    waybill_date DATE NOT NULL DEFAULT CURRENT_DATE,        -- Hujjat sanasi
    source_warehouse VARCHAR(255) DEFAULT 'Склад готовой продукции', -- Jo'natuvchi ombor
    destination VARCHAR(255) DEFAULT 'г. Москва (Wildberries / Ozon)', -- Qabul qiluvchi manzil
    order_number VARCHAR(64),                               -- Asosiy buyurtma kodi (masalan, "MOS-509.3")
    
    -- Jami hisob-kitob ko'rsatkichlari
    total_bags INTEGER DEFAULT 0,                           -- Jami qoplar (tara) soni
    total_qty INTEGER DEFAULT 0,                            -- Jami mahsulot soni (dona)
    total_gross_weight NUMERIC(10, 2) DEFAULT 0.00,         -- Jami brutto vazn (kg)
    
    -- Imzo qo'yuvchi mas'ul shaxslar
    director_name VARCHAR(128) DEFAULT 'A. Xoliqov',        -- Korxona rahbari (Директор)
    warehouse_manager VARCHAR(128) DEFAULT 'Q. Sobirov',    -- Ombor mudiri (Зав.склад)
    sender_name VARCHAR(128) DEFAULT 'I. Karimov',          -- Yukni topshiruvchi (Сдал)
    recipient_name VARCHAR(128) DEFAULT 'Ekspeditor / Haydovchi', -- Yukni qabul qiluvchi (Принял)
    
    -- Qo'shimcha parametrlar va holat
    status VARCHAR(32) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'shipped', 'cancelled')),
    notes TEXT,                                             -- Izohlar yoki qo'shimcha ma'lumotlar
    metadata JSONB DEFAULT '{}'::jsonb,                     -- OCR va eksport parametrlari
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_waybills_number ON public.waybills(waybill_number);
CREATE INDEX IF NOT EXISTS idx_waybills_date ON public.waybills(waybill_date);
CREATE INDEX IF NOT EXISTS idx_waybills_order ON public.waybills(order_number);

-- 3. Nakladnoy qatorlari (har bir qop yoki ko'p rangli qatorlar): waybill_items
CREATE TABLE IF NOT EXISTS public.waybill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waybill_id UUID NOT NULL REFERENCES public.waybills(id) ON DELETE CASCADE,
    row_order INTEGER NOT NULL,                             -- Tartib raqami (№ п/п, masalan: 89, 90, 91...)
    bag_number INTEGER,                                     -- Qop raqami (№ мешка, masalan: 2, 16)
    order_number VARCHAR(64) NOT NULL,                      -- Buyurtma raqami (Заказ, masalan: "MOS-509.3")
    model_code VARCHAR(128),                                -- Vertikal model kodi (masalan: "SM-1111/150-BK (брак)")
    product_name VARCHAR(255) NOT NULL,                     -- Mahsulot nomi (Наименование, masalan: "Фуфайка мужская")
    color VARCHAR(128) NOT NULL,                            -- Rangi (Цвет, masalan: "Белый")
    quantity INTEGER NOT NULL DEFAULT 0,                    -- Miqdori (Кол-во, dona)
    tara_count INTEGER DEFAULT 1,                           -- Tara qiymati (ko'p ranglilarda birinchi qatorda 1, keyingilarida 0)
    gross_weight NUMERIC(8, 2),                             -- Brutto vazn (Вес брутто, kg)
    
    -- Markirovka va OCR ma'lumotlari
    tara_raw VARCHAR(64),                                   -- Asl tara yozuvi (masalan: "2 / V2")
    image_url TEXT,                                         -- Qop suratining saqlangan manzili
    ai_read_method VARCHAR(32) DEFAULT 'gemini',            -- O'qish usuli ('gemini', 'local', 'manual')
    weight_unsure BOOLEAN DEFAULT FALSE,                    -- Vazn shubhali/qo'lda kiritilganlik bayrog'i
    ai_confidence NUMERIC(4, 2) DEFAULT 0.95,               -- AI aniqlik darajasi
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_waybill_items_waybill_id ON public.waybill_items(waybill_id);
CREATE INDEX IF NOT EXISTS idx_waybill_items_order ON public.waybill_items(order_number);
CREATE INDEX IF NOT EXISTS idx_waybill_items_bag ON public.waybill_items(bag_number);

-- 4. Markirovka o'qish loglari va xotirasi (xotira jadvali): label_recognition_logs
CREATE TABLE IF NOT EXISTS public.label_recognition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_name VARCHAR(255),
    image_url TEXT,
    order_extracted VARCHAR(64),
    model_extracted VARCHAR(128),
    colors_extracted JSONB,
    weight_extracted NUMERIC(8, 2),
    raw_ai_response JSONB,
    processing_time_ms INTEGER,
    status VARCHAR(32) DEFAULT 'success',
    user_corrections JSONB DEFAULT '{}'::jsonb,             -- Foydalanuvchi keyin kiritgan tuzatishlar (AI ni o'rgatish uchun)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RLS (Row Level Security) himoya qoidalari
ALTER TABLE public.waybills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waybill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.label_recognition_logs ENABLE ROW LEVEL SECURITY;

-- O'qish va yozish uchun ruxsatlar (ERP tizimi xodimlari uchun)
CREATE POLICY "Waybills o'qish ruxsati" ON public.waybills
    FOR SELECT USING (true);

CREATE POLICY "Waybills yozish ruxsati" ON public.waybills
    FOR ALL USING (true);

CREATE POLICY "Waybill items o'qish ruxsati" ON public.waybill_items
    FOR SELECT USING (true);

CREATE POLICY "Waybill items yozish ruxsati" ON public.waybill_items
    FOR ALL USING (true);

CREATE POLICY "Label logs o'qish ruxsati" ON public.label_recognition_logs
    FOR ALL USING (true);

-- 6. Trigger: waybills jadvalida updated_at ni avtomatik yangilash
CREATE OR REPLACE FUNCTION update_waybill_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_waybills_updated_at
BEFORE UPDATE ON public.waybills
FOR EACH ROW
EXECUTE FUNCTION update_waybill_updated_at();

-- Migratsiya yakunlandi
COMMENT ON TABLE public.waybills IS 'Chust Textile - Tayyor mahsulot yuk xatlari (Накладная)';
COMMENT ON TABLE public.waybill_items IS 'Yuk xatidagi tovarlar va qoplar ro''yxati';
