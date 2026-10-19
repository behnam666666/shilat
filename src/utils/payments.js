// src/utils/payments.js
// نحوه‌های پرداخت و محاسبات تفکیکی حساب‌های بانکی (کارت‌ها)

import { purchaseTotal, purchaseSideCosts, saleProfit, saleNet } from "./accounting";

export const PAYMENT_METHODS = [
  { value: "cash", label: "نقدی" },
  { value: "card", label: "کارت به کارت" },
  { value: "pos", label: "دستگاه پوز" },
  { value: "other", label: "موارد دیگر" },
];

export const paymentMethodLabel = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label ?? "—";

// برچسب نمایش کارت: «ملت ۳۳۴۴» — هم در UI هم در اکسل استفاده می‌شود
export const cardLabel = (card) => {
  if (!card) return "";
  const digits = String(card.cardNumber ?? "").replace(/\D/g, "");
  return digits ? `${card.bankName} ${digits.slice(-4)}` : card.bankName;
};

// نسبت پولی که واقعاً واریز شده (فروش نسیه → هنوز واریز نشده)
const paidRatio = (sale) => {
  const net = saleNet(sale);
  if (net <= 0) return 1;
  return Math.min(1, Math.max(0, (Number(sale.paid) || 0) / net));
};

// خلاصه جریان پول هر کارت: ورودی (فروش‌ها)، خروجی (خریدها)، خالص و سود واریزی
// نکته مهم: بهای تمام‌شده هر فروش همیشه از «کل» خریدها حساب می‌شود (allPurchases)
// حتی وقتی رکوردها برای یک بازه فیلتر شده‌اند — وگرنه بهای ماهی صفر و سود بادکرده می‌شود
export const cardsSummary = ({ purchases, sales, allPurchases = null }, cards) => {
  const costBasis = allPurchases ?? purchases;
  return cards.map((card) => {
    const cardSales = sales.filter((s) => s.cardId === card.id);
    const cardPurchases = purchases.filter((p) => p.cardId === card.id);

    const moneyIn = cardSales.reduce((s, r) => s + (Number(r.paid) || 0), 0);
    const moneyOut = cardPurchases.reduce(
      (s, r) => s + purchaseTotal(r) + purchaseSideCosts(r),
      0
    );
    // سود واریزی: سود فروش × نسبت پولی که واقعاً واریز شده (نسیه هنوز واریز نشده)
    const profit = cardSales.reduce(
      (s, r) => s + saleProfit(r, costBasis) * paidRatio(r),
      0
    );

    return {
      card,
      salesCount: cardSales.length,
      purchasesCount: cardPurchases.length,
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
      profit,
    };
  });
};

// جریان نقدی (پرداخت‌های بدون کارت) — با سود واریزی فروش‌های نقدی
export const cashSummary = ({ purchases, sales, allPurchases = null }) => {
  const costBasis = allPurchases ?? purchases;
  const cashSales = sales.filter((s) => !s.cardId);
  const cashPurchases = purchases.filter((p) => !p.cardId);
  return {
    moneyIn: cashSales.reduce((s, r) => s + (Number(r.paid) || 0), 0),
    moneyOut: cashPurchases.reduce((s, r) => s + purchaseTotal(r) + purchaseSideCosts(r), 0),
    profit: cashSales.reduce((s, r) => s + saleProfit(r, costBasis) * paidRatio(r), 0),
  };
};
