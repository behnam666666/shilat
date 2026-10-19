// src/services/excel/localStorageStore.js
// حالت جایگزین ذخیره‌سازی: حافظه محلی مرورگر + خروجی/ورودی دستی اکسل

const STORAGE_KEY = "shilat-data-v1";

export const isLocalStorageAvailable = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

export const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      purchases: parsed.purchases ?? [],
      sales: parsed.sales ?? [],
      fishTypes: parsed.fishTypes ?? [],
      losses: parsed.losses ?? [],
      cards: parsed.cards ?? [],
    };
  } catch {
    return null;
  }
};

export const saveLocal = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// خروجی اکسل به صورت دانلود فایل (وقتی Save File Picker در دسترس نیست)
export const downloadBuffer = (buffer, filename) => {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// ورود از اکسل: انتخاب فایل با input (سازگار با همه مرورگرها)
export const pickFileForImport = () =>
  new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = () => {
      if (input.files?.[0]) resolve(input.files[0]);
      else reject(new Error("no-file"));
    };
    input.click();
  });
