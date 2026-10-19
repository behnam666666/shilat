// src/contexts/DataContext.jsx
/* eslint-disable react-refresh/only-export-components */
// لایه داده برنامه: یک رابط یکسان برای هر دو حالت ذخیره‌سازی
//  - "file": اتصال مستقیم به فایل اکسل (File System Access API)
//  - "local": حافظه محلی مرورگر + خروجی/ورودی دستی اکسل
// هر تغییر به صورت خودکار (با تأخیر کوتاه) در محل ذخیره‌سازی نوشته می‌شود.

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { format } from "date-fns-jalali";
import { createId } from "../utils/idGenerator";
import { notify } from "../utils/notificationBridge";
import { formatJalaliDate, nowLocalIso } from "../utils/format";
import {
  recordsToWorkbookBuffer,
  workbookBufferToRecords,
  isEmptyWorkbookBuffer,
  SCHEMA_VERSION,
} from "../services/excel/workbook";
import {
  loadLocal,
  saveLocal,
  downloadBuffer,
  pickFileForImport,
} from "../services/excel/localStorageStore";
import {
  isFileAccessSupported,
  pickExcelFile,
  readFile,
  writeFile,
  getSavedHandle,
  forgetSavedHandle,
  checkPermission,
  requestPermission,
  saveBufferAs,
} from "../services/excel/fileSystemStore";

const DataContext = createContext(null);

const DEFAULT_FISH_TYPES = ["قزل‌آلا", "کپور", "فیتوفاگ", "آمور", "سوف"].map(
  (name, i) => ({ id: `default-fish-${i + 1}`, name, createdAt: new Date().toISOString() })
);

const EMPTY_DATA = {
  purchases: [],
  sales: [],
  fishTypes: DEFAULT_FISH_TYPES,
  losses: [],
  cards: [],
};

const nowIso = () => new Date().toISOString();

const excelFileName = () => {
  try {
    return `shilat-${formatJalaliDate(new Date(), "yyyy-MM-dd")}.xlsx`;
  } catch {
    return "shilat.xlsx";
  }
};

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState("local"); // 'file' | 'local'
  const [fileHandle, setFileHandle] = useState(null);
  const [reconnectPending, setReconnectPending] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const dataRef = useRef(data);
  const flushTimer = useRef(null);
  const handleRef = useRef(null);

  // همگام‌سازی refها بعد از رندر (نه در حین آن)
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    handleRef.current = fileHandle;
  }, [fileHandle]);

  const isFileSupported = useMemo(() => isFileAccessSupported(), []);

  // ---------- نوشتن در محل ذخیره‌سازی ----------
  const flush = useCallback(async () => {
    const current = dataRef.current;
    const buffer = recordsToWorkbookBuffer(current);
    const handle = handleRef.current;
    try {
      if (handle) {
        await writeFile(handle, buffer);
      }
      saveLocal(current); // مرورگر همیشه همگام می‌ماند (بکاپ خودکار)
      setIsDirty(false);
      setLastSaved(nowIso());
    } catch (err) {
      console.error("flush failed:", err);
      notify("ذخیره‌سازی با خطا مواجه شد! تغییرات در حافظه مرورگر محفوظ است.", "error");
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    setIsDirty(true);
    clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 700);
  }, [flush]);

  // قبل از بستن صفحه، تلاش برای ذخیره فوری
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!isDirty) return;
      clearTimeout(flushTimer.current);
      try {
        saveLocal(dataRef.current);
      } catch {
        /* ignore */
      }
      const handle = handleRef.current;
      if (handle) {
        // نوشتن فایل در قبل از خروج تضمینی نیست؛ debounce کوتاه است و ریسک کم
        const buffer = recordsToWorkbookBuffer(dataRef.current);
        try {
          // best-effort synchronous-ish write
          writeFile(handle, buffer);
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  // ---------- راه‌اندازی اولیه ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = loadLocal();
      const localData = { ...EMPTY_DATA, ...(local ?? {}) };
      if (!localData.losses) localData.losses = [];
      if (!localData.cards) localData.cards = [];
      if (localData.fishTypes.length === 0) {
        localData.fishTypes = DEFAULT_FISH_TYPES;
      }
      if (cancelled) return;

      const savedHandle = isFileAccessSupported() ? await getSavedHandle() : null;
      if (savedHandle) {
        const permission = await checkPermission(savedHandle);
        if (permission === "granted") {
          try {
            const buffer = await readFile(savedHandle);
            if (isEmptyWorkbookBuffer(buffer)) {
              // فایل تازه ساخته‌شده → داده‌های فعلی داخلش نوشته می‌شود
              await writeFile(savedHandle, recordsToWorkbookBuffer(localData));
            } else {
              const fileData = workbookBufferToRecords(buffer);
              setData(fileData);
              dataRef.current = fileData;
            }
            setFileHandle(savedHandle);
            setStorageMode("file");
            setIsLoading(false);
            setIsDirty(false);
            return;
          } catch (err) {
            console.error("auto-reconnect failed:", err);
          }
        } else if (permission === "prompt") {
          setReconnectPending(true);
        } else {
          await forgetSavedHandle();
        }
      }

      setData(localData);
      setIsLoading(false);
      // اگر فایل اکسل قبلی هنوز وصل نیست ولی داده‌ها هست، در اولین ذخیره مرتب می‌شوند
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- اتصال / قطع فایل ----------
  const connectFile = useCallback(async () => {
    try {
      const handle = await pickExcelFile();
      const buffer = await readFile(handle);
      let nextData;
      if (isEmptyWorkbookBuffer(buffer)) {
        nextData = dataRef.current;
        await writeFile(handle, recordsToWorkbookBuffer(nextData));
      } else {
        nextData = workbookBufferToRecords(buffer);
      }
      setData(nextData);
      dataRef.current = nextData;
      setFileHandle(handle);
      setStorageMode("file");
      setReconnectPending(false);
      setIsDirty(false);
      saveLocal(nextData);
      notify("فایل اکسل با موفقیت متصل شد. تغییرات مستقیم در فایل ذخیره می‌شود.");
      return true;
    } catch (err) {
      if (err?.name === "AbortError") return false;
      console.error("connect failed:", err);
      notify("اتصال به فایل اکسل ناموفق بود.", "error");
      return false;
    }
  }, []);

  // اتصال مجدد به فایل قبلی (فقط با حرکت کاربر — درخواست اجازه)
  const reconnectFile = useCallback(async () => {
    const savedHandle = await getSavedHandle();
    if (!savedHandle) return false;
    const permission = await requestPermission(savedHandle);
    if (permission !== "granted") {
      notify("اجازه دسترسی به فایل داده نشد.", "warning");
      return false;
    }
    try {
      const buffer = await readFile(savedHandle);
      if (!isEmptyWorkbookBuffer(buffer)) {
        const fileData = workbookBufferToRecords(buffer);
        setData(fileData);
        dataRef.current = fileData;
      }
      setFileHandle(savedHandle);
      setStorageMode("file");
      setReconnectPending(false);
      setIsDirty(false);
      notify("دوباره به فایل اکسل متصل شدید.");
      return true;
    } catch (err) {
      console.error("reconnect failed:", err);
      notify("اتصال مجدد به فایل ناموفق بود.", "error");
      return false;
    }
  }, []);

  const disconnectFile = useCallback(async () => {
    await forgetSavedHandle();
    setFileHandle(null);
    setStorageMode("local");
    setReconnectPending(false);
    notify("از حالت فایل خارج شدید. تغییرات در حافظه مرورگر ذخیره می‌شود.", "info");
  }, []);

  // ---------- عملیات CRUD ----------
  const mutate = useCallback(
    (updater) => {
      // dataRef همیشه آخرین داده را نگه می‌دارد (همگام در اثر و در همین‌جا)
      const next = updater(dataRef.current);
      dataRef.current = next;
      setData(next);
      scheduleFlush();
    },
    [scheduleFlush]
  );

  const addPurchase = useCallback(
    (p) => {
      // هر خرید یک «بسته» است — شماره بسته خودکار و ترتیبی
      const nextBatchNo =
        dataRef.current.purchases.reduce((m, r) => Math.max(m, Number(r.batchNo) || 0), 0) + 1;
      const record = {
        ...p,
        id: createId(),
        batchNo: nextBatchNo,
        date: p.date || nowLocalIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      mutate((prev) => ({ ...prev, purchases: [record, ...prev.purchases] }));
      return record;
    },
    [mutate]
  );

  const updatePurchase = useCallback(
    (id, patch) => {
      mutate((prev) => ({
        ...prev,
        purchases: prev.purchases.map((r) =>
          r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r
        ),
      }));
    },
    [mutate]
  );

  const deletePurchase = useCallback(
    (id) => {
      mutate((prev) => ({ ...prev, purchases: prev.purchases.filter((r) => r.id !== id) }));
    },
    [mutate]
  );

  const addSale = useCallback(
    (s) => {
      const record = {
        ...s,
        id: createId(),
        date: s.date || nowLocalIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      mutate((prev) => ({ ...prev, sales: [record, ...prev.sales] }));
      return record;
    },
    [mutate]
  );

  const updateSale = useCallback(
    (id, patch) => {
      mutate((prev) => ({
        ...prev,
        sales: prev.sales.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r)),
      }));
    },
    [mutate]
  );

  const deleteSale = useCallback(
    (id) => {
      mutate((prev) => ({ ...prev, sales: prev.sales.filter((r) => r.id !== id) }));
    },
    [mutate]
  );

  const addFishType = useCallback(
    (name) => {
      const trimmed = String(name ?? "").trim();
      if (!trimmed) return null;
      const exists = dataRef.current.fishTypes.some((f) => f.name === trimmed);
      if (exists) {
        notify("این مدل قبلاً اضافه شده است.", "warning");
        return null;
      }
      const record = { id: createId(), name: trimmed, createdAt: nowIso() };
      mutate((prev) => ({ ...prev, fishTypes: [...prev.fishTypes, record] }));
      return record;
    },
    [mutate]
  );

  const deleteFishType = useCallback(
    (id) => {
      mutate((prev) => ({ ...prev, fishTypes: prev.fishTypes.filter((f) => f.id !== id) }));
    },
    [mutate]
  );

  // ---------- تلفات (ماهی تلف‌شده از یک بسته) ----------
  const addLoss = useCallback(
    (l) => {
      const record = {
        ...l,
        id: createId(),
        date: l.date || nowLocalIso(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      mutate((prev) => ({ ...prev, losses: [record, ...(prev.losses ?? [])] }));
      return record;
    },
    [mutate]
  );

  const deleteLoss = useCallback(
    (id) => {
      mutate((prev) => ({ ...prev, losses: (prev.losses ?? []).filter((l) => l.id !== id) }));
    },
    [mutate]
  );

  // ---------- کارت‌های بانکی ----------
  const addCard = useCallback(
    (c) => {
      const bankName = String(c?.bankName ?? "").trim();
      if (!bankName) return null;
      const record = {
        id: createId(),
        bankName,
        cardNumber: String(c?.cardNumber ?? "").trim(),
        holder: String(c?.holder ?? "").trim(),
        createdAt: nowIso(),
      };
      mutate((prev) => ({ ...prev, cards: [...(prev.cards ?? []), record] }));
      return record;
    },
    [mutate]
  );

  const deleteCard = useCallback(
    (id) => {
      mutate((prev) => ({ ...prev, cards: (prev.cards ?? []).filter((c) => c.id !== id) }));
    },
    [mutate]
  );

  // ---------- بستن/بازکردن بسته (تمام شدن ماهی یک خرید) ----------
  const closePurchase = useCallback(
    (id) => {
      updatePurchase(id, { closed: true, closedAt: nowIso() });
    },
    [updatePurchase]
  );

  const reopenPurchase = useCallback(
    (id) => {
      updatePurchase(id, { closed: false, closedAt: null });
    },
    [updatePurchase]
  );

  // ---------- خروجی / ورودی اکسل ----------
  const exportExcel = useCallback(async () => {
    const buffer = recordsToWorkbookBuffer(dataRef.current);
    const filename = excelFileName();
    try {
      if (isFileAccessSupported()) {
        await saveBufferAs(buffer, filename);
        notify("فایل اکسل ذخیره شد.");
      } else {
        downloadBuffer(buffer, filename);
        notify("فایل اکسل دانلود شد.");
      }
    } catch (err) {
      if (err?.name === "AbortError") return;
      downloadBuffer(buffer, filename);
      notify("فایل اکسل دانلود شد.");
    }
  }, []);

  const importExcel = useCallback(async () => {
    try {
      const file = await pickFileForImport();
      const buffer = await file.arrayBuffer();
      const imported = workbookBufferToRecords(buffer);
      mutate(() => imported);
      notify("اطلاعات از فایل اکسل خوانده شد.");
      return true;
    } catch (err) {
      if (err?.message === "no-file") return false;
      console.error("import failed:", err);
      notify("خواندن فایل اکسل ناموفق بود.", "error");
      return false;
    }
  }, [mutate]);

  const downloadJsonBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(dataRef.current, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shilat-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify("بکاپ JSON دانلود شد.");
  }, []);

  const value = useMemo(
    () => ({
      // داده‌ها
      purchases: data.purchases,
      sales: data.sales,
      fishTypes: data.fishTypes,
      losses: data.losses ?? [],
      cards: data.cards ?? [],
      // عملیات خرید
      addPurchase,
      updatePurchase,
      deletePurchase,
      // عملیات فروش
      addSale,
      updateSale,
      deleteSale,
      // مدل ماهی
      addFishType,
      deleteFishType,
      // تلفات
      addLoss,
      deleteLoss,
      // کارت بانکی
      addCard,
      deleteCard,
      // بستن بسته
      closePurchase,
      reopenPurchase,
      // ذخیره‌سازی
      storageMode,
      isFileSupported,
      reconnectPending,
      connectFile,
      reconnectFile,
      disconnectFile,
      exportExcel,
      importExcel,
      downloadJsonBackup,
      isDirty,
      lastSaved,
      isLoading,
      schemaVersion: SCHEMA_VERSION,
    }),
    [
      data,
      addPurchase,
      updatePurchase,
      deletePurchase,
      addSale,
      updateSale,
      deleteSale,
      addFishType,
      deleteFishType,
      addLoss,
      deleteLoss,
      addCard,
      deleteCard,
      closePurchase,
      reopenPurchase,
      storageMode,
      isFileSupported,
      reconnectPending,
      connectFile,
      reconnectFile,
      disconnectFile,
      exportExcel,
      importExcel,
      downloadJsonBackup,
      isDirty,
      lastSaved,
      isLoading,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData باید داخل DataProvider استفاده شود");
  }
  return ctx;
};
