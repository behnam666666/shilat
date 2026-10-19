// src/pages/Purchases/PurchaseForm.jsx
/* eslint-disable react-refresh/only-export-components */
// فرم افزودن/ویرایش خرید با محاسبه زنده مبلغ کل، جمع هزینه‌ها و میانگین وزن هر ماهی

import { useMemo } from "react";
import * as yup from "yup";
import { Box, Grid, TextField, MenuItem, Divider, Typography } from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import FormModal from "../../components/common/FormModal";
import JalaliDateTimePicker from "../../components/common/JalaliDateTimePicker";
import NumberField from "../../components/common/NumberField";
import FormTextField from "../../components/common/FormTextField";
import PaymentFields from "../../components/common/PaymentFields";
import { useData } from "../../contexts/DataContext";
import { formatToman, formatNumber, nowLocalIso } from "../../utils/format";

export const purchaseSchema = yup.object({
  date: yup.string().required("تاریخ الزامی است"),
  fishTypeId: yup.string().required("مدل ماهی را انتخاب کنید"),
  weightKg: yup
    .number()
    .transform((v, o) => (o === "" ? undefined : v))
    .typeError("وزن را عدد وارد کنید")
    .positive("وزن باید مثبت باشد")
    .required("وزن الزامی است"),
  count: yup
    .number()
    .transform((v, o) => (o === "" || o === null ? undefined : v))
    .typeError("تعداد را عدد وارد کنید")
    .integer("تعداد باید عدد صحیح باشد")
    .positive("تعداد باید مثبت باشد")
    .notRequired(),
  pricePerKg: yup
    .number()
    .transform((v, o) => (o === "" ? undefined : v))
    .typeError("قیمت را عدد وارد کنید")
    .min(0, "قیمت نمی‌تواند منفی باشد")
    .required("قیمت الزامی است"),
  seller: yup.string(),
  transportCost: yup
    .number()
    .transform((v, o) => (o === "" ? 0 : v))
    .typeError("کرایه را عدد وارد کنید")
    .min(0, "کرایه نمی‌تواند منفی باشد")
    .default(0),
  otherCosts: yup
    .number()
    .transform((v, o) => (o === "" ? 0 : v))
    .typeError("هزینه را عدد وارد کنید")
    .min(0, "هزینه نمی‌تواند منفی باشد")
    .default(0),
  paymentMethod: yup.string().default("cash"),
  // نحوه پرداخت خرید صرفاً اطلاعاتی است و در سود اثر ندارد؛
  // فقط برای کارت‌به‌کارت و پوز انتخاب کارت لازم است
  cardId: yup
    .string()
    .test("card", "برای کارت‌به‌کارت یا پوز، کارت را انتخاب کنید", function (value) {
      if (!["card", "pos"].includes(this.parent.paymentMethod)) return true;
      return !!value;
    }),
  notes: yup.string(),
});

// محاسبه زنده داخل فرم: مبلغ کل، جمع هزینه‌ها و میانگین وزن هر ماهی
function LivePurchaseTotals() {
  const { watch } = useFormContext();
  const weightKg = Number(watch("weightKg")) || 0;
  const count = Number(watch("count")) || 0;
  const pricePerKg = Number(watch("pricePerKg")) || 0;
  const transportCost = Number(watch("transportCost")) || 0;
  const otherCosts = Number(watch("otherCosts")) || 0;

  const total = weightKg * pricePerKg;
  const grandTotal = total + transportCost + otherCosts;
  const avgWeight = count > 0 ? weightKg / count : null;

  return (
    <Box
      sx={{
        bgcolor: "primary.950",
        border: "1px solid",
        borderColor: "primary.900",
        borderRadius: 2,
        p: 1.5,
        display: "flex",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary">
          مبلغ کل خرید
        </Typography>
        <Typography fontWeight={700}>{formatToman(total)}</Typography>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box>
        <Typography variant="caption" color="text.secondary">
          میانگین وزن هر ماهی
        </Typography>
        <Typography fontWeight={700}>
          {avgWeight !== null ? `${formatNumber(avgWeight)} کیلو` : "—"}
        </Typography>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box>
        <Typography variant="caption" color="text.secondary">
          کل با هزینه‌ها
        </Typography>
        <Typography fontWeight={700} color="primary.300">
          {formatToman(grandTotal)}
        </Typography>
      </Box>
    </Box>
  );
}

// فیلدهای فرم — داخل FormProvider رندر می‌شوند
function PurchaseFormFields() {
  const { fishTypes, cards } = useData();
  const { control } = useFormContext();

  return (
    <>
      <LivePurchaseTotals />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <JalaliDateTimePicker name="date" control={control} label="تاریخ و ساعت خرید" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="fishTypeId"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <TextField
                select
                label="مدل ماهی"
                size="small"
                fullWidth
                value={value ?? ""}
                onChange={onChange}
                error={!!error}
                helperText={error?.message}
              >
                {fishTypes.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <NumberField name="weightKg" label="وزن" unit="کیلو" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <NumberField name="count" label="تعداد ماهی (اختیاری)" unit="عدد" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <NumberField name="pricePerKg" label="قیمت هر کیلو" unit="تومان" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField name="seller" label="فروشنده (از چه کسی خریده شده)" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberField name="transportCost" label="کرایه" unit="تومان" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberField name="otherCosts" label="هزینه‌های دیگر" unit="تومان" />
        </Grid>
        <PaymentFields cards={cards} methodLabel="نحوه پرداخت خرید" />
        <Grid size={{ xs: 12 }}>
          <FormTextField name="notes" label="توضیحات" multiline minRows={2} />
        </Grid>
      </Grid>
    </>
  );
}

export default function PurchaseForm({ open, initialValues, onClose }) {
  const { addPurchase, updatePurchase } = useData();
  const isEdit = !!initialValues?.id;

  const defaultValues = useMemo(
    () =>
      initialValues ?? {
        date: nowLocalIso(),
        fishTypeId: "",
        weightKg: "",
        count: "",
        pricePerKg: "",
        seller: "",
        transportCost: 0,
        otherCosts: 0,
        paymentMethod: "cash",
        cardId: "",
        notes: "",
      },
    [initialValues]
  );

  return (
    <FormModal
      open={open}
      key={initialValues?.id ?? "new-purchase"}
      title={isEdit ? "ویرایش خرید" : "ثبت خرید جدید"}
      onClose={onClose}
      form={{
        schema: purchaseSchema,
        defaultValues,
        onSubmit: async (values) => {
          const payload = {
            ...values,
            weightKg: Number(values.weightKg),
            count: values.count === "" || values.count === undefined || values.count === null ? null : Number(values.count),
            pricePerKg: Number(values.pricePerKg),
            transportCost: Number(values.transportCost) || 0,
            otherCosts: Number(values.otherCosts) || 0,
            paymentMethod: values.paymentMethod || "cash",
            cardId: values.paymentMethod === "cash" ? null : values.cardId || null,
          };
          if (isEdit) {
            updatePurchase(initialValues.id, payload);
          } else {
            addPurchase(payload);
          }
          onClose?.();
        },
        children: <PurchaseFormFields />,
      }}
    />
  );
}
