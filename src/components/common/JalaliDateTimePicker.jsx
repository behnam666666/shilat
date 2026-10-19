// src/components/common/JalaliDateTimePicker.jsx
// فیلد انتخاب تاریخ و ساعت شمسی — فرم‌ها مقدار را yyyy-mm-ddTHH:mm محلی ذخیره می‌کنند
// (مثل JalaliDatePicker خودش LocalizationProvider را دارد)

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFnsJalali } from "@mui/x-date-pickers/AdapterDateFnsJalali";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Controller } from "react-hook-form";
import { faIR } from "date-fns-jalali/locale";

export default function JalaliDateTimePicker({ name, control, label, rules }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFnsJalali} adapterLocale={faIR}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <DateTimePicker
            label={label}
            ampm={false}
            value={value ? new Date(value) : null}
            onChange={(date) => onChange(date ? toLocalIso(date) : "")}
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

// Date → yyyy-mm-ddTHH:mm (بدون منطقه زمانی، ساعت محلی)
const toLocalIso = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};
