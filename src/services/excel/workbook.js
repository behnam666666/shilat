// src/services/excel/workbook.js
// نگاشت رکوردهای برنامه به فایل اکسل و برعکس
// ساختار فایل: یک ورک‌بوک با شیت‌های خرید / فروش / مدل ماهی + شیت مخفی __متا
// نسخه ۲: ستون «بسته» برای اتصال فروش به بسته خرید + ستون «ساعت»

import * as XLSX from "xlsx";
import { newDate } from "date-fns-jalali";
import { createId } from "../../utils/idGenerator";
import { formatJalaliDate } from "../../utils/format";
import { paymentMethodLabel, cardLabel, PAYMENT_METHODS } from "../../utils/payments";

export const SCHEMA_VERSION = 5;

export const SHEET_NAMES = {
  purchases: "خرید",
  sales: "فروش",
  fishTypes: "مدل ماهی",
  losses: "تلفات",
  personal: "مصرف شخصی",
  cards: "کارت بانکی",
  meta: "__متا",
};

// ستون مخفی شناسه برای پایداری آپدیت/حذف ردیف‌ها بعد از جابه‌جایی در اکسل
const ID_HEADER = "شناسه";

const PURCHASE_HEADERS = [
  ID_HEADER,
  "بسته",
  "تاریخ",
  "ساعت",
  "مدل ماهی",
  "وزن (کیلوگرم)",
  "تعداد",
  "میانگین وزن هر ماهی (کیلوگرم)",
  "قیمت هر کیلو (تومان)",
  "مبلغ کل (تومان)",
  "فروشنده",
  "کرایه (تومان)",
  "هزینه‌های دیگر (تومان)",
  "نحوه پرداخت",
  "کارت",
  "تمام‌شده",
  "توضیحات",
];

const LOSS_HEADERS = [
  ID_HEADER,
  "بسته",
  "تاریخ",
  "ساعت",
  "وزن (کیلوگرم)",
  "تعداد",
  "توضیحات تلفات",
];

// مصرف شخصی هم‌ساختار تلفات است ولی شیت و عنوان توضیحات خودش را دارد
const PERSONAL_HEADERS = [
  ID_HEADER,
  "بسته",
  "تاریخ",
  "ساعت",
  "وزن (کیلوگرم)",
  "تعداد",
  "توضیحات مصرف",
];

const SALE_HEADERS = [
  ID_HEADER,
  "بسته",
  "تاریخ",
  "ساعت",
  "مدل ماهی",
  "وزن (کیلوگرم)",
  "تعداد",
  "قیمت هر کیلو (تومان)",
  "مبلغ کل (تومان)",
  "مشتری",
  "تخفیف (تومان)",
  "انعام (تومان)",
  "پرداخت‌شده (تومان)",
  "نحوه پرداخت",
  "کارت",
  "توضیحات",
];

const FISH_TYPE_HEADERS = [ID_HEADER, "نام مدل"];

const CARD_HEADERS = [ID_HEADER, "بانک", "شماره کارت", "به نام"];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------- جدا کردن تاریخ و ساعت از مقدار yyyy-mm-ddTHH:mm ----------

const datePart = (value) => (value ? String(value).slice(0, 10) : "");
const timePart = (value) => {
  if (!value) return "";
  const t = String(value).slice(11, 16);
  return /^\d{2}:\d{2}$/.test(t) ? t : "";
};

// ---------- ساخت ورک‌بوک از رکوردها ----------

const purchaseRow = (p, fishName, cardLabelStr) => [
  p.id,
  p.batchNo ?? "",
  formatJalaliDate(datePart(p.date)), // 1404/06/29 با ارقام لاتین
  timePart(p.date),
  fishName ?? "",
  num(p.weightKg),
  p.count ?? "",
  Number(p.count) > 0 ? num(p.weightKg) / Number(p.count) : "",
  num(p.pricePerKg),
  num(p.weightKg) * num(p.pricePerKg),
  p.seller ?? "",
  num(p.transportCost),
  num(p.otherCosts),
  p.paymentMethod ? paymentMethodLabel(p.paymentMethod) : "",
  cardLabelStr ?? "",
  p.closed ? "بله" : "",
  p.notes ?? "",
];

const saleRow = (s, fishName, batchNo, cardLabelStr) => [
  s.id,
  batchNo ?? "",
  formatJalaliDate(datePart(s.date)),
  timePart(s.date),
  fishName ?? "",
  num(s.weightKg),
  s.count ?? "",
  num(s.pricePerKg),
  num(s.weightKg) * num(s.pricePerKg) - num(s.discount),
  s.customer ?? "",
  num(s.discount),
  num(s.tip),
  num(s.paid),
  s.paymentMethod ? paymentMethodLabel(s.paymentMethod) : "",
  cardLabelStr ?? "",
  s.notes ?? "",
];

const sheetFromRows = (headers, rows) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  // ستون شناسه مخفی می‌شود تا فایل برای کاربر تمیز بماند
  ws["!cols"] = headers.map((h, i) => ({
    hidden: i === 0 && headers[0] === ID_HEADER,
    wch: h === ID_HEADER ? 36 : Math.max(12, h.length + 2),
  }));
  return ws;
};

// رکوردها → بافر اکسل
export const recordsToWorkbookBuffer = ({ purchases = [], sales = [], fishTypes = [], losses = [], cards = [] }) => {
  const fishNameById = new Map(fishTypes.map((f) => [f.id, f.name]));
  const batchNoById = new Map(purchases.map((p) => [p.id, p.batchNo]));
  const cardLabelById = new Map(cards.map((c) => [c.id, cardLabel(c)]));

  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] }; // باز شدن شیت‌ها راست‌به‌چپ در اکسل

  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(PURCHASE_HEADERS, purchases.map((p) =>
      purchaseRow(p, fishNameById.get(p.fishTypeId), cardLabelById.get(p.cardId))
    )),
    SHEET_NAMES.purchases
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(SALE_HEADERS, sales.map((s) =>
      saleRow(s, fishNameById.get(s.fishTypeId), batchNoById.get(s.purchaseId), cardLabelById.get(s.cardId))
    )),
    SHEET_NAMES.sales
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(FISH_TYPE_HEADERS, fishTypes.map((f) => [f.id, f.name])),
    SHEET_NAMES.fishTypes
  );
  // تلفات و مصرف شخصی — هر کدام شیت خودشان (هر دو از آرایه losses با kind متمایز می‌شوند)
  const deductionRow = (d) => [
    d.id,
    batchNoById.get(d.purchaseId) ?? "",
    formatJalaliDate(datePart(d.date)),
    timePart(d.date),
    num(d.weightKg),
    d.count ?? "",
    d.description ?? "",
  ];
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      LOSS_HEADERS,
      losses.filter((l) => l.kind !== "personal").map(deductionRow)
    ),
    SHEET_NAMES.losses
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      PERSONAL_HEADERS,
      losses.filter((l) => l.kind === "personal").map(deductionRow)
    ),
    SHEET_NAMES.personal
  );
  XLSX.utils.book_append_sheet(
    wb,
    sheetFromRows(
      CARD_HEADERS,
      cards.map((c) => [c.id, c.bankName ?? "", c.cardNumber ?? "", c.holder ?? ""])
    ),
    SHEET_NAMES.cards
  );

  const metaWs = XLSX.utils.aoa_to_sheet([
    ["_schema", "shilat"],
    ["_version", SCHEMA_VERSION],
    ["_updatedAt", new Date().toISOString()],
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, SHEET_NAMES.meta);
  // شیت متا از دید کاربر در اکسل مخفی می‌ماند
  if (wb.Workbook.Sheets?.length) {
    wb.Workbook.Sheets[wb.Workbook.Sheets.length - 1].Hidden = 1;
  }

  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
};

// ---------- خواندن رکوردها از فایل اکسل ----------

const pad2 = (n) => String(n).padStart(2, "0");

const parseJalali = (value) => {
  // ورودی مورد انتظار: 1404/06/29 (ارقام لاتین شمسی) — خروجی: yyyy-mm-dd میلادی
  // توجه: newDate ورودی شمسی را به Date میلادی تبدیل می‌کند؛ خروجی را باید خودمان با ارقام میلادی بسازیم
  if (!value) return null;
  const m = String(value).trim().match(/(\d{3,4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return null;
  try {
    const d = newDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  } catch {
    return null;
  }
};

// ساعت 14:30 → ترکیب با تاریخ میلادی به yyyy-mm-ddTHH:mm
const parseTime = (value, isoDate) => {
  const m = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m || !isoDate) return `${isoDate}T00:00`;
  return `${isoDate}T${pad2(Number(m[1]))}:${m[2]}`;
};

const readSheet = (wb, sheetName) => {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" });
};

const fishNameKey = (name) => String(name ?? "").trim();

// متن نحوه پرداخت در اکسل → مقدار داخلی
const parsePaymentMethod = (value) => {
  const key = String(value ?? "").trim();
  if (!key) return null;
  return PAYMENT_METHODS.find((m) => m.label === key)?.value ?? null;
};

// بافر اکسل → رکوردها (نام مدل به شناسه تبدیل، شماره بسته به شناسه خرید، مدل‌های جدید ساخته می‌شوند)
export const workbookBufferToRecords = (buffer) => {
  const wb = XLSX.read(buffer, { type: "array" });

  const fishTypes = readSheet(wb, SHEET_NAMES.fishTypes)
    .filter((r) => fishNameKey(r["نام مدل"]))
    .map((r) => ({
      id: String(r[ID_HEADER] || createId()),
      name: fishNameKey(r["نام مدل"]),
      createdAt: new Date().toISOString(),
    }));

  const nameToId = new Map(fishTypes.map((f) => [fishNameKey(f.name), f.id]));
  const resolveFishType = (name) => {
    const key = fishNameKey(name);
    if (!key) return null;
    if (!nameToId.has(key)) {
      // مدل دیده‌شده در فایل ولی خارج از شیت مدل‌ها → ساخت خودکار
      const created = { id: createId(), name: key, createdAt: new Date().toISOString() };
      fishTypes.push(created);
      nameToId.set(key, created.id);
    }
    return nameToId.get(key);
  };

  // کارت‌های بانکی — در ستون «کارت» رکوردها با برچسب (بانک + ۴رقم آخر) ارجاع می‌شوند
  const cards = readSheet(wb, SHEET_NAMES.cards)
    .filter((r) => String(r["بانک"] ?? "").trim())
    .map((r) => ({
      id: String(r[ID_HEADER] || createId()),
      bankName: String(r["بانک"]).trim(),
      cardNumber: String(r["شماره کارت"] ?? ""),
      holder: String(r["به نام"] ?? ""),
      createdAt: new Date().toISOString(),
    }));
  const cardLabelToId = new Map(cards.map((c) => [cardLabel(c), c.id]));
  const resolveCard = (value) => {
    const key = String(value ?? "").trim();
    if (!key) return null;
    if (!cardLabelToId.has(key)) {
      const created = {
        id: createId(),
        bankName: key,
        cardNumber: "",
        holder: "",
        createdAt: new Date().toISOString(),
      };
      cards.push(created);
      cardLabelToId.set(key, created.id);
    }
    return cardLabelToId.get(key);
  };

  // خریدها — بسته‌های بدون شماره (فایل نسخه ۱) به ترتیب تاریخ شماره می‌گیرند
  const purchasesRaw = readSheet(wb, SHEET_NAMES.purchases)
    .filter((r) => r["تاریخ"] || r["وزن (کیلوگرم)"] !== "");
  const explicitMax = Math.max(0, ...purchasesRaw.map((r) => Number(r["بسته"]) || 0));
  let nextBatchNo = explicitMax + 1;
  const unparsed = [];
  const purchases = purchasesRaw
    .map((r) => {
      const isoDate = parseJalali(r["تاریخ"]) ?? new Date().toISOString().slice(0, 10);
      let batchNo = Number(r["بسته"]) || 0;
      if (!batchNo) {
        unparsed.push(r);
        batchNo = null;
      }
      // تعداد: یا مستقیم، یا از وزن ÷ میانگین وزن هر ماهی
      let count = num(r["تعداد"]);
      if (!count) {
        const avgWeight = num(r["میانگین وزن هر ماهی (کیلوگرم)"]);
        const weight = num(r["وزن (کیلوگرم)"]);
        count = avgWeight > 0 ? Math.round(weight / avgWeight) : null;
      }
      return {
        id: String(r[ID_HEADER] || createId()),
        date: parseTime(r["ساعت"], isoDate),
        fishTypeId: resolveFishType(r["مدل ماهی"]),
        weightKg: num(r["وزن (کیلوگرم)"]),
        count: count || null,
        pricePerKg: num(r["قیمت هر کیلو (تومان)"]),
        seller: String(r["فروشنده"] ?? ""),
        transportCost: num(r["کرایه (تومان)"]),
        otherCosts: num(r["هزینه‌های دیگر (تومان)"]),
        paymentMethod: parsePaymentMethod(r["نحوه پرداخت"]),
        cardId: resolveCard(r["کارت"]),
        closed: String(r["تمام‌شده"] ?? "").trim() === "بله",
        notes: String(r["توضیحات"] ?? ""),
        batchNo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    })
    // بسته‌های بدون شماره به ترتیب تاریخ شماره می‌گیرند
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((p) => ({ ...p, batchNo: p.batchNo ?? nextBatchNo++ }));

  // فروش‌ها — شماره بسته به شناسه خرید تبدیل می‌شود
  const batchNoToId = new Map(purchases.map((p) => [p.batchNo, p.id]));
  const sales = readSheet(wb, SHEET_NAMES.sales)
    .filter((r) => r["تاریخ"] || r["وزن (کیلوگرم)"] !== "")
    .map((r) => ({
      id: String(r[ID_HEADER] || createId()),
      date: parseTime(r["ساعت"], parseJalali(r["تاریخ"]) ?? new Date().toISOString().slice(0, 10)),
      fishTypeId: resolveFishType(r["مدل ماهی"]),
      purchaseId: batchNoToId.get(Number(r["بسته"]) || 0) ?? null,
      weightKg: num(r["وزن (کیلوگرم)"]),
      count: num(r["تعداد"]) || null,
      pricePerKg: num(r["قیمت هر کیلو (تومان)"]),
      customer: String(r["مشتری"] ?? ""),
      discount: num(r["تخفیف (تومان)"]),
      tip: num(r["انعام (تومان)"]),
      paid: num(r["پرداخت‌شده (تومان)"]),
      paymentMethod: parsePaymentMethod(r["نحوه پرداخت"]),
      cardId: resolveCard(r["کارت"]),
      notes: String(r["توضیحات"] ?? ""),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  // تلفات — شماره بسته به شناسه خرید تبدیل می‌شود
  const losses = readSheet(wb, SHEET_NAMES.losses)
    .filter((r) => r["تاریخ"] || r["وزن (کیلوگرم)"] !== "")
    .map((r) => ({
      id: String(r[ID_HEADER] || createId()),
      purchaseId: batchNoToId.get(Number(r["بسته"]) || 0) ?? null,
      date: parseTime(r["ساعت"], parseJalali(r["تاریخ"]) ?? new Date().toISOString().slice(0, 10)),
      weightKg: num(r["وزن (کیلوگرم)"]),
      count: num(r["تعداد"]) || null,
      description: String(r["توضیحات تلفات"] ?? ""),
      kind: "loss",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  // مصرف شخصی — شیت جدا ولی همان ساختار
  const personalUsages = readSheet(wb, SHEET_NAMES.personal)
    .filter((r) => r["تاریخ"] || r["وزن (کیلوگرم)"] !== "")
    .map((r) => ({
      id: String(r[ID_HEADER] || createId()),
      purchaseId: batchNoToId.get(Number(r["بسته"]) || 0) ?? null,
      date: parseTime(r["ساعت"], parseJalali(r["تاریخ"]) ?? new Date().toISOString().slice(0, 10)),
      weightKg: num(r["وزن (کیلوگرم)"]),
      count: num(r["تعداد"]) || null,
      description: String(r["توضیحات مصرف"] ?? ""),
      kind: "personal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  return { purchases, sales, fishTypes, losses: [...losses, ...personalUsages], cards };
};

// خالی بودن فایل اکسل (اولین اتصال به فایل جدید) — شیت‌ها فقط هدر دارند
export const isEmptyWorkbookBuffer = (buffer) => {
  try {
    const wb = XLSX.read(buffer, { type: "array" });
    const hasRows = (sheetName) => {
      const ws = wb.Sheets[sheetName];
      if (!ws) return false;
      return XLSX.utils.sheet_to_json(ws).length > 0;
    };
    return !hasRows(SHEET_NAMES.purchases) && !hasRows(SHEET_NAMES.sales);
  } catch {
    return false;
  }
};

export { ID_HEADER };
