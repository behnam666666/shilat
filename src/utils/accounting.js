// src/utils/accounting.js
// توابع محاسباتی خالص حسابداری (بدون وابستگی به React)
// همه گروه‌بندی‌های دوره‌ای با تقویم شمسی انجام می‌شود (هفته از شنبه).

import {
  startOfWeek,
  startOfMonth,
  startOfDay,
  isSameDay,
  isSameMonth,
  format,
} from "date-fns-jalali";

// ---------- محاسبات تک رکورد ----------

// فروش خالص = وزن × قیمت − تخفیف
export const saleNet = (sale) =>
  (Number(sale.weightKg) || 0) * (Number(sale.pricePerKg) || 0) - (Number(sale.discount) || 0);

// درآمد واقعی = فروش خالص − انعام (انعام پول داده‌شده به غیر است)
export const saleRevenue = (sale) => saleNet(sale) - (Number(sale.tip) || 0);

// مبلغ کل خرید = وزن × قیمت
export const purchaseTotal = (purchase) =>
  (Number(purchase.weightKg) || 0) * (Number(purchase.pricePerKg) || 0);

// هزینه‌های جانبی یک خرید (کرایه + سایر)
export const purchaseSideCosts = (purchase) =>
  (Number(purchase.transportCost) || 0) + (Number(purchase.otherCosts) || 0);

// بدهی باقی‌مانده یک فروش (نسیه)
export const saleOutstanding = (sale) => Math.max(0, saleNet(sale) - (Number(sale.paid) || 0));

// سود یک فروش: درآمد واقعی (پس از تخفیف و انعام) − بهای وزن فروخته‌شده
// بهای هر کیلو از بسته خرید (اگر مشخص باشد) وگرنه از میانگین موزون مدل
export const saleProfit = (sale, purchases = []) => {
  const weight = Number(sale.weightKg) || 0;
  let costPerKg = weightedAvgCostPerKg(purchases, sale.fishTypeId);
  if (sale.purchaseId) {
    const purchase = purchases.find((p) => p.id === sale.purchaseId);
    if (purchase) costPerKg = batchCostPerKg(purchase);
  }
  return saleRevenue(sale) - weight * costPerKg;
};

// ---------- بهای تمام‌شده ----------

// میانگین موزون بهای هر کیلو برای یک مدل ماهی
// (کرایه و هزینه‌های دیگر به نسبت وزن هر خرید بین همان مدل توزیع می‌شود)
export const weightedAvgCostPerKg = (purchases, fishTypeId) => {
  const items = purchases.filter((p) => p.fishTypeId === fishTypeId);
  const totalWeight = items.reduce((s, p) => s + (Number(p.weightKg) || 0), 0);
  if (totalWeight === 0) return 0;
  const totalCost = items.reduce(
    (s, p) => s + purchaseTotal(p) + purchaseSideCosts(p),
    0
  );
  return totalCost / totalWeight;
};

// ---------- بسته‌های خرید ----------

// میانگین وزن هر ماهی در یک بسته (وزن ÷ تعداد) — اگر تعداد ثبت نشده باشد null
export const batchAvgWeightKg = (purchase) => {
  const count = Number(purchase.count) || 0;
  if (count <= 0) return null;
  return (Number(purchase.weightKg) || 0) / count;
};

// بهای هر کیلو یک بسته (کل خرید + کرایه و هزینه‌ها تقسیم بر وزن)
export const batchCostPerKg = (purchase) => {
  const weight = Number(purchase.weightKg) || 0;
  if (weight === 0) return 0;
  return (purchaseTotal(purchase) + purchaseSideCosts(purchase)) / weight;
};

// وضعیت موجودی هر بسته: وزن و تعداد — خریداری‌شده، فروخته‌شده، تلفات، مصرف شخصی و باقی‌مانده
// تلفات و مصرف شخصی هر دو از موجودی کم می‌شوند (رکوردها با kind متمایز می‌شوند: 'loss' | 'personal')
export const batchStock = (purchases, sales, deductions = []) => {
  const map = new Map();
  purchases.forEach((p) => {
    map.set(p.id, {
      purchase: p,
      purchasedKg: Number(p.weightKg) || 0,
      purchasedCount: Number(p.count) || 0,
      soldKg: 0,
      soldCount: 0,
      lostKg: 0,
      lostCount: 0,
      personalKg: 0,
      personalCount: 0,
      remainingKg: Number(p.weightKg) || 0,
      remainingCount: Number(p.count) || 0,
    });
  });
  sales.forEach((s) => {
    if (!s.purchaseId) return;
    const entry = map.get(s.purchaseId);
    if (!entry) return;
    entry.soldKg += Number(s.weightKg) || 0;
    entry.soldCount += Number(s.count) || 0;
    entry.remainingKg -= Number(s.weightKg) || 0;
    if (entry.purchasedCount > 0) {
      entry.remainingCount -= Number(s.count) || 0;
    }
  });
  deductions.forEach((d) => {
    if (!d.purchaseId) return;
    const entry = map.get(d.purchaseId);
    if (!entry) return;
    if (d.kind === "personal") {
      entry.personalKg += Number(d.weightKg) || 0;
      entry.personalCount += Number(d.count) || 0;
    } else {
      entry.lostKg += Number(d.weightKg) || 0;
      entry.lostCount += Number(d.count) || 0;
    }
    entry.remainingKg -= Number(d.weightKg) || 0;
    if (entry.purchasedCount > 0) {
      entry.remainingCount -= Number(d.count) || 0;
    }
  });
  return map; // Map<purchaseId, {purchase, purchasedKg, purchasedCount, soldKg, soldCount, lostKg, lostCount, personalKg, personalCount, remainingKg, remainingCount}>
};

// سود تحقق‌یافته یک بسته = درآمد فروش‌ها − بهای وزن فروخته‌شده − بهای تلفات − بهای مصرف شخصی
// بهای هر کیلو ثابت است (کل هزینه ÷ وزن خرید) و تلفات/مصرف به عنوان خسارت جداگانه حساب می‌شود
export const batchProfit = ({ purchases, sales, losses = [] }, purchaseId) => {
  const purchase = purchases.find((p) => p.id === purchaseId);
  if (!purchase) return null;
  const batchSales = sales.filter((s) => s.purchaseId === purchaseId);
  const costPerKg = batchCostPerKg(purchase);
  const revenue = batchSales.reduce((s, r) => s + saleRevenue(r), 0);
  const soldKg = batchSales.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);
  const soldCount = batchSales.reduce((s, r) => s + (Number(r.count) || 0), 0);
  const soldCost = soldKg * costPerKg;

  const batchDeductions = losses.filter((d) => d.purchaseId === purchaseId);
  const batchLosses = batchDeductions.filter((d) => d.kind !== "personal");
  const batchPersonal = batchDeductions.filter((d) => d.kind === "personal");

  const lostKg = batchLosses.reduce((s, l) => s + (Number(l.weightKg) || 0), 0);
  const lostCount = batchLosses.reduce((s, l) => s + (Number(l.count) || 0), 0);
  const lostCost = lostKg * costPerKg;

  const personalKg = batchPersonal.reduce((s, d) => s + (Number(d.weightKg) || 0), 0);
  const personalCount = batchPersonal.reduce((s, d) => s + (Number(d.count) || 0), 0);
  const personalCost = personalKg * costPerKg;

  return {
    purchase,
    batchSales,
    batchLosses,
    batchPersonal,
    costPerKg,
    totalCost: purchaseTotal(purchase) + purchaseSideCosts(purchase),
    soldKg,
    soldCount,
    lostKg,
    lostCount,
    lostCost,
    personalKg,
    personalCount,
    personalCost,
    remainingKg: (Number(purchase.weightKg) || 0) - soldKg - lostKg - personalKg,
    remainingCount: (Number(purchase.count) || 0) - soldCount - lostCount - personalCount,
    revenue,
    soldCost,
    profit: revenue - soldCost - lostCost - personalCost,
  };
};

// ---------- سود به تفکیک مدل ماهی ----------

// سود یک مدل ماهی: اول از بسته‌ها (دقیق + تلفات + مصرف شخصی)، بعد فروش‌های بدون بسته (میانگین موزون)
export const fishTypeProfit = ({ purchases, sales, losses = [] }, fishTypeId) => {
  const typePurchases = purchases.filter((p) => p.fishTypeId === fishTypeId);
  const relevantSales = sales.filter((s) => s.fishTypeId === fishTypeId);

  const revenue = relevantSales.reduce((s, r) => s + saleRevenue(r), 0);
  const soldWeight = relevantSales.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);

  // بهای بخش فروخته‌شده، تلفات و مصرف شخصی بسته‌های مشخص
  let batchSoldKg = 0;
  let batchSoldCost = 0;
  let batchLostCost = 0;
  let batchPersonalCost = 0;
  typePurchases.forEach((p) => {
    const bp = batchProfit({ purchases, sales, losses }, p.id);
    if (bp) {
      batchSoldKg += bp.soldKg;
      batchSoldCost += bp.soldCost;
      batchLostCost += bp.lostCost;
      batchPersonalCost += bp.personalCost;
    }
  });

  // فروش‌های بدون بسته با میانگین موزون قیمت خرید حساب می‌شود
  const avgCost = weightedAvgCostPerKg(purchases, fishTypeId);
  const unassignedKg = Math.max(0, soldWeight - batchSoldKg);
  const cost = batchSoldCost + batchLostCost + batchPersonalCost + unassignedKg * avgCost;

  return { revenue, cost, profit: revenue - cost, soldWeight, costPerKg: avgCost };
};

// ---------- گروه‌بندی دوره‌ای ----------

// تبدیل امن به Date — تاریخ خراب یا نامعلوم → null (نه Invalid Date که format را می‌ترکاند)
export const toDate = (date) => {
  if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date;
  if (typeof date !== "string" || !date.trim()) return null;
  const d = date.length === 10 ? new Date(`${date}T00:00:00`) : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
};

// کلید دوره بر اساس تقویم شمسی
export const periodKey = (date, granularity) => {
  const d = toDate(date);
  if (!d) return "";
  try {
    if (granularity === "day") return format(startOfDay(d), "yyyy-MM-dd");
    if (granularity === "week") return format(startOfWeek(d, { weekStartsOn: 6 }), "yyyy-MM-dd"); // شنبه
    if (granularity === "month") return format(startOfMonth(d), "yyyy-MM");
  } catch {
    return "";
  }
  return "";
};

const emptyTotals = () => ({ count: 0, weight: 0, gross: 0, discount: 0, tip: 0, net: 0 });

// جمع فروش‌ها به تفکیک دوره (روز/هفته/ماه) — مرتب از قدیم به جدید
export const totalsByPeriod = (sales, granularity = "day") => {
  const map = new Map();
  sales.forEach((s) => {
    const key = periodKey(s.date, granularity);
    if (!key) return;
    if (!map.has(key)) map.set(key, emptyTotals());
    const t = map.get(key);
    t.count += 1;
    t.weight += Number(s.weightKg) || 0;
    t.gross += (Number(s.weightKg) || 0) * (Number(s.pricePerKg) || 0);
    t.discount += Number(s.discount) || 0;
    t.tip += Number(s.tip) || 0;
    t.net += saleNet(s);
  });
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
};

// جمع فروش‌های یک مدل ماهی در یک دوره
export const totalsByFishType = ({ purchases, sales, losses = [] }, fishTypes) =>
  fishTypes.map((f) => {
    const ftSales = sales.filter((s) => s.fishTypeId === f.id);
    const { revenue, cost, profit, soldWeight } = fishTypeProfit(
      { purchases, sales, losses },
      f.id
    );
    return {
      fishType: f,
      soldWeight,
      revenue,
      cost,
      profit,
      discount: ftSales.reduce((s, r) => s + (Number(r.discount) || 0), 0),
      tip: ftSales.reduce((s, r) => s + (Number(r.tip) || 0), 0),
      outstanding: ftSales.reduce((s, r) => s + saleOutstanding(r), 0),
    };
  });

// جمع کل یک آرایه فروش
export const sumSales = (sales) =>
  sales.reduce(
    (acc, s) => {
      acc.count += 1;
      acc.weight += Number(s.weightKg) || 0;
      acc.gross += (Number(s.weightKg) || 0) * (Number(s.pricePerKg) || 0);
      acc.discount += Number(s.discount) || 0;
      acc.tip += Number(s.tip) || 0;
      acc.net += saleNet(s);
      acc.paid += Number(s.paid) || 0;
      return acc;
    },
    { count: 0, weight: 0, gross: 0, discount: 0, tip: 0, net: 0, paid: 0 }
  );

// ---------- فیلترهای دوره ----------

export const salesToday = (sales, now = new Date()) => {
  const d0 = toDate(now);
  return sales.filter((s) => {
    const d = toDate(s.date);
    return d && d0 && isSameDay(d, d0);
  });
};

export const salesThisWeek = (sales, now = new Date()) => {
  const start = startOfWeek(now, { weekStartsOn: 6 });
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return sales.filter((s) => {
    const d = toDate(s.date);
    return d && d >= start && d < end;
  });
};

export const salesThisMonth = (sales, now = new Date()) => {
  const d0 = toDate(now);
  return sales.filter((s) => {
    const d = toDate(s.date);
    return d && d0 && isSameMonth(d, d0);
  });
};

// کل بدهی‌های نشده
export const outstandingReceivables = (sales) =>
  sales.reduce((sum, s) => sum + saleOutstanding(s), 0);

// موجودی انبار به تفکیک مدل ماهی: خریداری‌شده، فروخته‌شده، تلفات، مصرف شخصی، باقی‌مانده
export const stockByFishType = ({ purchases, sales, losses = [] }, fishTypes) =>
  fishTypes.map((f) => {
    const typePurchases = purchases.filter((p) => p.fishTypeId === f.id);
    const typeSales = sales.filter((s) => s.fishTypeId === f.id);
    const typeDeductions = losses.filter((d) => {
      const purchase = purchases.find((p) => p.id === d.purchaseId);
      return purchase?.fishTypeId === f.id;
    });
    const purchasedKg = typePurchases.reduce((s, p) => s + (Number(p.weightKg) || 0), 0);
    const soldKg = typeSales.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);
    const lostKg = typeDeductions
      .filter((d) => d.kind !== "personal")
      .reduce((s, d) => s + (Number(d.weightKg) || 0), 0);
    const personalKg = typeDeductions
      .filter((d) => d.kind === "personal")
      .reduce((s, d) => s + (Number(d.weightKg) || 0), 0);
    return {
      fishType: f,
      purchasedKg,
      soldKg,
      lostKg,
      personalKg,
      remainingKg: purchasedKg - soldKg - lostKg - personalKg,
    };
  });

// سود کل (همه مدل‌ها) برای یک بازه از فروش — تلفات هم در بهای حساب می‌شود
export const profitForSales = ({ purchases, sales, losses = [] }) => {
  const byType = new Map();
  sales.forEach((s) => {
    if (!byType.has(s.fishTypeId)) byType.set(s.fishTypeId, []);
    byType.get(s.fishTypeId).push(s);
  });
  let profit = 0;
  let revenue = 0;
  let cost = 0;
  byType.forEach((typeSales, fishTypeId) => {
    const r = fishTypeProfit({ purchases, sales: typeSales, losses }, fishTypeId);
    profit += r.profit;
    revenue += r.revenue;
    cost += r.cost;
  });
  return { profit, revenue, cost };
};
