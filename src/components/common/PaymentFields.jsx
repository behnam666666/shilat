// src/components/common/PaymentFields.jsx
// فیلدهای مشترک نحوه پرداخت: نقدی / کارت به کارت / پوز + انتخاب کارت بانکی
// برای خرید (پول خارج می‌شود) و فروش (پول داخل می‌شود) استفاده می‌شود.

import { Grid, TextField, MenuItem } from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import { PAYMENT_METHODS } from "../../utils/payments";

export default function PaymentFields({ cards, methodLabel = "نحوه پرداخت" }) {
  const { control, watch } = useFormContext();
  const method = watch("paymentMethod");

  return (
    <>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field: { value, onChange } }) => (
            <TextField
              select
              label={methodLabel}
              size="small"
              fullWidth
              value={value ?? "cash"}
              onChange={onChange}
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m.value} value={m.value}>
                  {m.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </Grid>
      {method && method !== "cash" && (
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="cardId"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <TextField
                select
                label="کارت / حساب"
                size="small"
                fullWidth
                value={value ?? ""}
                onChange={onChange}
                error={!!error}
                helperText={
                  error?.message ??
                  (cards.length === 0 ? "اول از تنظیمات یک کارت اضافه کنید" : undefined)
                }
              >
                {cards.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.bankName}
                    {c.cardNumber ? ` — ${c.cardNumber}` : ""}
                    {c.holder ? ` (${c.holder})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
      )}
    </>
  );
}
