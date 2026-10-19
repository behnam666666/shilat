// src/services/excel/fileSystemStore.js
// اتصال مستقیم به فایل اکسل از طریق File System Access API (کروم/اج)
// هندل فایل در IndexedDB نگه داشته می‌شود تا بعد از ریلود بدون انتخاب دوباره وصل شود

import { get, set, del } from "idb-keyval";

const HANDLE_KEY = "shilat-file-handle";

export const isFileAccessSupported = () =>
  typeof window !== "undefined" && "showOpenFilePicker" in window;

// انتخاب فایل اکسل توسط کاربر (فقط با حرکت کاربر)
export const pickExcelFile = async () => {
  const [handle] = await window.showOpenFilePicker({
    types: [
      {
        description: "فایل اکسل",
        accept: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        },
      },
    ],
    multiple: false,
  });
  await set(HANDLE_KEY, handle);
  return handle;
};

// خواندن محتوای فایل
export const readFile = async (handle) => {
  const file = await handle.getFile();
  return file.arrayBuffer();
};

// نوشتن کامل فایل (بازنویسی کل ورک‌بوک — در مقیاس چند صد ردیف سریع است)
export const writeFile = async (handle, buffer) => {
  const writable = await handle.createWritable();
  await writable.write(buffer);
  await writable.close();
};

// هندل ذخیره‌شده از اجرای قبلی را برمی‌گرداند
export const getSavedHandle = async () => {
  try {
    return (await get(HANDLE_KEY)) ?? null;
  } catch {
    return null;
  }
};

export const forgetSavedHandle = async () => {
  try {
    await del(HANDLE_KEY);
  } catch {
    /* ignore */
  }
};

export const checkPermission = async (handle) => {
  try {
    return (await handle.queryPermission({ mode: "readwrite" })) ?? "denied";
  } catch {
    return "denied";
  }
};

// درخواست اجازه (نیاز به حرکت کاربر دارد)
export const requestPermission = async (handle) => {
  try {
    return (await handle.requestPermission({ mode: "readwrite" })) ?? "denied";
  } catch {
    return "denied";
  }
};

// خروجی اکسل با انتخاب محل ذخیره توسط کاربر
export const saveBufferAs = async (buffer, suggestedName) => {
  const handle = await window.showSaveFilePicker({
    suggestedName,
    types: [
      {
        description: "فایل اکسل",
        accept: {
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        },
      },
    ],
  });
  await writeFile(handle, buffer);
  return handle;
};
