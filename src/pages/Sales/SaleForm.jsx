// src/pages/Sales/SaleForm.jsx
// فرم افزودن/ویرایش فروش با انتخاب بسته خرید، نمایش موجودی هر بسته
// و محاسبه زنده مبلغ کل پس از تخفیف

import { useMemo } from "react";
import * as yup from "yup";
import { Box, Grid, TextField, MenuItem, Typography, Button, Tooltip } from "@mui/material";
import { useFormContext, Controller } from "react-hook-form";
import FormModal from "../../components/common/FormModal";
import JalaliDateTimePicker from "../../components/common/JalaliDateTimePicker";
import NumberField from "../../components/common/NumberField";
import FormTextField from "../../components/common/FormTextField";
import PaymentFields from "../../components/common/PaymentFields";
import { useData } from "../../contexts/DataContext";
import { notify } from "../../utils/notificationBridge";
import { formatToman, formatNumber, toPersianDigits, nowLocalIso } from "../../utils/format";
import { batchStock } from "../../utils/accounting";

// شمای فرم — وزن فروش سقف ندارد چون ماهی در دوره نگهداری وزن می‌گیرد و
// مجموع فروش می‌تواند از وزن خرید اولیه بیشتر شود
const buildSaleSchema = () =>
  yup.object({
    date: yup.string().required("تاریخ الزامی است"),
    fishTypeId: yup.string().required("مدل ماهی را انتخاب کنید"),
    purchaseId: yup
      .string()
      .required("بسته خرید را انتخاب کنید — مشخص کنید از کدام خرید می‌فروشید"),
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
    customer: yup.string(),
    discount: yup
      .number()
      .transform((v, o) => (o === "" ? 0 : v))
      .typeError("تخفیف را عدد وارد کنید")
      .min(0, "تخفیف نمی‌تواند منفی باشد")
      .default(0),
    tip: yup
      .number()
      .transform((v, o) => (o === "" ? 0 : v))
      .typeError("انعام را عدد وارد کنید")
      .min(0, "انعام نمی‌تواند منفی باشد")
      .default(0),
    paid: yup
      .number()
      .transform((v, o) => (o === "" ? 0 : v))
      .typeError("مبلغ را عدد وارد کنید")
      .min(0, "مبلغ نمی‌تواند منفی باشد")
      .default(0),
    paymentMethod: yup.string().default("cash"),
    cardId: yup
      .string()
      .test("card", "برای کارت‌به‌کارت یا پوز، کارت را انتخاب کنید", function (value) {
        if (!["card", "pos"].includes(this.parent.paymentMethod)) return true;
        return !!value;
      }),
    notes: yup.string(),
  });

// محاسبه زنده داخل فرم + دکمه تسویه خودکار
// اگر پرداختی بیشتر از مبلغ کل بود → مازاد انعام؛ اگر کمتر بود → کسری تخفیف
function LiveSaleTotals() {
  const { watch, setValue } = useFormContext();
  const weightKg = Number(watch("weightKg")) || 0;
  const pricePerKg = Number(watch("pricePerKg")) || 0;
  const discount = Number(watch("discount")) || 0;
  const tip = Number(watch("tip")) || 0;
  const paid = Number(watch("paid")) || 0;

  const gross = weightKg * pricePerKg;
  const net = gross - discount;
  const canReconcile = gross > 0 && paid > 0;

  const reconcile = () => {
    if (paid >= gross) {
      setValue("tip", Math.round(paid - gross));
      setValue("discount", 0);
      notify("مازاد پرداخت به عنوان انعام ثبت شد.", "info");
    } else {
      setValue("discount", Math.round(gross - paid));
      setValue("tip", 0);
      notify("کسری پرداخت به عنوان تخفیف ثبت شد.", "info");
    }
  };

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
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary">
          مبلغ کل
        </Typography>
        <Typography fontWeight={700}>{formatToman(gross)}</Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          پس از تخفیف
        </Typography>
        <Typography fontWeight={700} color="success.main">
          {formatToman(net)}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          انعام
        </Typography>
        <Typography fontWeight={700} color="warning.main">
          {formatToman(tip)}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          پرداخت‌شده
        </Typography>
        <Typography fontWeight={700} color="primary.300">
          {formatToman(paid)}
        </Typography>
      </Box>
      <Tooltip title="با مبلغ پرداختی تسویه می‌کند: اگر بیشتر از مبلغ کل باشد مازاد انعام می‌شود و اگر کمتر باشد کسری تخفیف">
        <span>
          <Button
            size="small"
            variant="outlined"
            onClick={reconcile}
            disabled={!canReconcile}
          >
            تسویه خودکار
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}

// فیلدهای فرم — داخل FormProvider رندر می‌شوند
function SaleFormFields({ batches }) {
  const { fishTypes, cards } = useData();
  const { control, watch, setValue } = useFormContext();
  const selectedFishTypeId = watch("fishTypeId");
  const selectedPurchaseId = watch("purchaseId");

  // بسته‌های همان مدل ماهی (با موجودی)
  const availableBatches = batches.filter((b) => b.fishTypeId === selectedFishTypeId);
  const selectedBatch = availableBatches.find((b) => b.id === selectedPurchaseId);

  return (
    <>
      <LiveSaleTotals />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <JalaliDateTimePicker name="date" control={control} label="تاریخ و ساعت فروش" />
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
                onChange={(e) => {
                  onChange(e.target.value);
                  // با عوض شدن مدل، اگر بسته انتخاب‌شده از همان مدل نبود پاک می‌شود
                  if (
                    selectedPurchaseId &&
                    !batches.some(
                      (b) => b.id === selectedPurchaseId && b.fishTypeId === e.target.value
                    )
                  ) {
                    setValue("purchaseId", "");
                  }
                }}
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
        <Grid size={{ xs: 12 }}>
          <Controller
            name="purchaseId"
            control={control}
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <TextField
                select
                label="بسته خرید (از کدام خرید می‌فروشید)"
                size="small"
                fullWidth
                value={value ?? ""}
                onChange={onChange}
                error={!!error}
                helperText={
                  error?.message ??
                  (selectedBatch
                    ? `${selectedBatch.seller ? `خرید از ${selectedBatch.seller} — ` : ""}${
                        selectedBatch.remainingKg < 0
                          ? `رشد ماهی: ${formatNumber(-selectedBatch.remainingKg)} کیلو بیش از خرید اولیه — `
                          : `موجودی این بسته: ${formatNumber(selectedBatch.remainingKg)} کیلو${selectedBatch.purchasedCount > 0 ? ` / ${formatNumber(selectedBatch.remainingCount)} عدد` : ""} — `
                      }بهای هر کیلو: ${formatToman(selectedBatch.costPerKg)}`
                    : "با انتخاب مدل ماهی، بسته‌های موجود همان مدل نشان داده می‌شود")
                }
              >
                {selectedFishTypeId === "" && (
                  <MenuItem disabled value="">
                    اول مدل ماهی را انتخاب کنید
                  </MenuItem>
                )}
                {availableBatches.length === 0 && selectedFishTypeId !== "" && (
                  <MenuItem disabled value="">
                    از این مدل بسته‌ای ثبت نشده است
                  </MenuItem>
                )}
                {availableBatches.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    بسته {toPersianDigits(b.batchNo)}
                    {b.seller ? ` — ${b.seller}` : ""} —{" "}
                    {b.remainingKg < 0
                      ? `${formatNumber(-b.remainingKg)}+ کیلو (رشد)`
                      : `موجودی ${formatNumber(b.remainingKg)} کیلو`}
                    {b.purchasedCount > 0
                      ? ` / ${formatNumber(b.remainingCount)} عدد`
                      : ""} — بهای هر کیلو {formatToman(b.costPerKg)}
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
          <FormTextField name="customer" label="مشتری" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberField name="discount" label="تخفیف" unit="تومان" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberField name="tip" label="انعام" unit="تومان" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <NumberField name="paid" label="پرداخت‌شده" unit="تومان" />
        </Grid>
        <PaymentFields cards={cards} methodLabel="نحوه پرداخت فروش" />
        <Grid size={{ xs: 12 }}>
          <FormTextField name="notes" label="توضیحات" multiline minRows={2} />
        </Grid>
      </Grid>
    </>
  );
}

export default function SaleForm({ open, initialValues, onClose }) {
  const { purchases, sales, losses, addSale, updateSale } = useData();
  const isEdit = !!initialValues?.id;

  // فهرست بسته‌های باز برای dropdown (قدیمی‌ترین اول) — بسته‌های تمام‌شده انتخاب نمی‌شوند
  // موجودی ممکن است منفی شود (رشد ماهی) و این مشکلی برای ثبت فروش نیست
  const batches = useMemo(() => {
    const stock = batchStock(purchases, sales, losses);
    return purchases
      .filter((p) => !p.closed)
      .map((p) => {
        const s = stock.get(p.id) ?? {};
        // در حالت ویرایش، وزن همین فروش به موجودی نمایشی بسته‌اش برمی‌گردد
        const editAddBack =
          isEdit && initialValues.purchaseId === p.id ? Number(initialValues.weightKg) || 0 : 0;
        return {
          id: p.id,
          batchNo: p.batchNo,
          fishTypeId: p.fishTypeId,
          seller: p.seller ?? "",
          remainingKg: ((s.remainingKg ?? Number(p.weightKg)) || 0) + editAddBack,
          purchasedCount: s.purchasedCount ?? 0,
          remainingCount: (s.remainingCount ?? 0) + editAddBack,
          costPerKg:
            (Number(p.weightKg) || 0) > 0
              ? ((Number(p.weightKg) || 0) * (Number(p.pricePerKg) || 0) +
                  (Number(p.transportCost) || 0) +
                  (Number(p.otherCosts) || 0)) /
                (Number(p.weightKg) || 1)
              : 0,
        };
      })
      .sort((a, b) => (a.batchNo ?? 0) - (b.batchNo ?? 0));
  }, [purchases, sales, losses, initialValues, isEdit]);

  const defaultValues = useMemo(
    () =>
      initialValues ?? {
        date: nowLocalIso(),
        fishTypeId: "",
        purchaseId: "",
        weightKg: "",
        count: "",
        pricePerKg: "",
        customer: "",
        discount: 0,
        tip: 0,
        paid: 0,
        paymentMethod: "cash",
        cardId: "",
        notes: "",
      },
    [initialValues]
  );

  return (
    <FormModal
      open={open}
      key={initialValues?.id ?? "new-sale"}
      title={isEdit ? "ویرایش فروش" : "ثبت فروش جدید"}
      onClose={onClose}
      form={{
        schema: buildSaleSchema(),
        defaultValues,
        onSubmit: async (values) => {
          const payload = {
            ...values,
            weightKg: Number(values.weightKg),
            count: values.count === "" || values.count === undefined || values.count === null ? null : Number(values.count),
            pricePerKg: Number(values.pricePerKg),
            discount: Number(values.discount) || 0,
            tip: Number(values.tip) || 0,
            paid: Number(values.paid) || 0,
            paymentMethod: values.paymentMethod || "cash",
            cardId: values.paymentMethod === "cash" ? null : values.cardId || null,
          };
          if (isEdit) {
            updateSale(initialValues.id, payload);
          } else {
            addSale(payload);
          }
          onClose?.();
        },
        children: <SaleFormFields batches={batches} />,
      }}
    />
  );
}
