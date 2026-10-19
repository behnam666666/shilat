// src/utils/idGenerator.js

// تولید شناسه یکتا برای رکوردها (خرید/فروش/مدل ماهی)
export const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
