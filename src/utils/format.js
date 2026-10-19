// src/utils/format.js

import { format, parseISO } from "date-fns-jalali";

// تبدیل ارقام لاتین به فارسی
export const toPersianDigits = (value) =>
  String(value ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

// تبدیل ارقام فارسی/عربی به لاتین (برای ورودی‌های کاربر)
export const toLatinDigits = (value) =>
  String(value ?? "")
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));

// قالب‌بندی مبلغ به تومان با جداکننده هزارگان فارسی
export const formatToman = (amount) => {
  const n = Number(amount) || 0;
  return `${toPersianDigits(n.toLocaleString("en-US"))} تومان`;
};

// قالب‌بندی عدد ساده با ارقام فارسی
export const formatNumber = (value) => {
  const n = Number(value) || 0;
  return toPersianDigits(n.toLocaleString("en-US", { maximumFractionDigits: 2 }));
};

// رشته تاریخ شمسی با ارقام لاتین (قابل پارس — برای ذخیره در اکسل)
export const formatJalaliDate = (date, pattern = "yyyy/MM/dd") => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, pattern);
  } catch {
    return "";
  }
};

// نمایش تاریخ شمسی با ارقام فارسی (برای UI)
export const formatJalaliDateFa = (date, pattern = "yyyy/MM/dd") =>
  toPersianDigits(formatJalaliDate(date, pattern));

// نمایش تاریخ و ساعت شمسی با ارقام فارسی (برای UI)
export const formatJalaliDateTimeFa = (date) =>
  toPersianDigits(formatJalaliDate(date, "yyyy/MM/dd"));

// جدا کردن سه‌رقمی بخش صحیح رشته عددی (برای نمایش زنده داخل input)
export const groupNumberInput = (str) => {
  if (str === "" || str === null || str === undefined) return "";
  const parts = String(str).split(".");
  const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.length > 1 ? `${grouped}.${parts[1]}` : grouped;
};

// زمان حال به صورت yyyy-mm-ddTHH:mm محلی (برای مقدار پیش‌فرض فرم‌ها)
export const nowLocalIso = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};
