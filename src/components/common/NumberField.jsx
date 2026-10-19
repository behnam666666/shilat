// src/components/common/NumberField.jsx
// فیلد عددی متصل به react-hook-form
// ارقام فارسی را می‌پذیرد، سه‌رقمی با کاما نمایش می‌دهد (خوانا برای مبالغ)
// و مقدار را به صورت عدد/رشته لاتین در فرم نگه می‌دارد.

import { TextField, InputAdornment } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { toLatinDigits, toPersianDigits, groupNumberInput } from "../../utils/format";

export default function NumberField({ name, label, unit, ...props }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <TextField
          {...props}
          label={label}
          size="small"
          fullWidth
          type="text"
          inputMode="decimal"
          value={value === 0 || value ? toPersianDigits(groupNumberInput(value)) : ""}
          onChange={(e) => {
            let latin = toLatinDigits(e.target.value).replace(/[^\d.]/g, "");
            // فقط یک نقطه اعشار مجاز است
            const dotCount = (latin.match(/\./g) || []).length;
            if (dotCount > 1) latin = latin.slice(0, latin.lastIndexOf("."));
            onChange(latin === "" ? "" : latin);
          }}
          error={!!error}
          helperText={error?.message}
          InputProps={
            unit
              ? {
                  endAdornment: (
                    <InputAdornment position="start" sx={{ fontSize: 12 }}>
                      {unit}
                    </InputAdornment>
                  ),
                }
              : undefined
          }
        />
      )}
    />
  );
}
