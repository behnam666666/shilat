// src/components/common/JalaliDatePicker.jsx
// فیلد انتخاب تاریخ شمسی — فرم‌ها تاریخ را میلادی (yyyy-mm-dd) ذخیره می‌کنند
// هر فیلد خودش LocalizationProvider (تقویم جلالی، لوکال فارسی) را دارد
// تا در هر صفحه‌ای بدون تنظیم اضافه کار کند.

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFnsJalali } from "@mui/x-date-pickers/AdapterDateFnsJalali";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Controller } from "react-hook-form";
import { parseISO } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

// فیلد متصل به react-hook-form
export default function JalaliDatePicker({ name, control, label, rules }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFnsJalali} adapterLocale={faIR}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <DatePicker
            label={label}
            value={value ? parseISO(value) : null}
            onChange={(date) => onChange(date ? formatIso(date) : "")}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                error: !!error,
                helperText: error?.message,
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
}

const formatIso = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
