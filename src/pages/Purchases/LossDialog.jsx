// src/pages/Purchases/LossDialog.jsx
// ثبت و مدیریت تلفات یا مصرف شخصی یک بسته خرید
// هر دو از موجودی بسته کم می‌شوند و بهای آن‌ها به عنوان هزینه در سود حساب می‌شود.
// kind: 'loss' = تلفات (ماهی مرده/خراب) | 'personal' = مصرف شخصی (برداشت برای خود مصرفی)

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Stack,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useData } from "../../contexts/DataContext";
import { toLatinDigits, toPersianDigits, formatNumber, formatJalaliDateFa, nowLocalIso } from "../../utils/format";
import { notify } from "../../utils/notificationBridge";

const KIND_LABELS = {
  loss: { title: "تلفات", descLabel: "توضیحات تلفات — چرا تلف شد؟", placeholder: "مثلاً گرمای هوا / خرابی" },
  personal: { title: "مصرف شخصی", descLabel: "توضیحات مصرف — برای چه مصرفی برداشته شد؟", placeholder: "مثلاً مصرف خانواده / مهمان" },
};

export default function LossDialog({ open, purchase, fishName, stockEntry, kind = "loss", onClose }) {
  const { losses, addLoss, deleteLoss } = useData();
  const [weightKg, setWeightKg] = useState("");
  const [count, setCount] = useState("");
  const [description, setDescription] = useState("");

  if (!purchase) return null;
  const labels = KIND_LABELS[kind] ?? KIND_LABELS.loss;

  // رکوردهای همین بسته با همین نوع
  const batchRecords = (losses ?? []).filter(
    (l) => l.purchaseId === purchase.id && (l.kind ?? "loss") === kind
  );

  const handleAdd = () => {
    const weight = Number(toLatinDigits(weightKg));
    if (!weight || weight <= 0) {
      notify("وزن را وارد کنید.", "warning");
      return;
    }
    if (!description.trim()) {
      notify("توضیحات را بنویسید.", "warning");
      return;
    }
    const parsedCount = Number(toLatinDigits(count));
    addLoss({
      purchaseId: purchase.id,
      date: nowLocalIso(),
      weightKg: weight,
      count: parsedCount > 0 ? parsedCount : null,
      description: description.trim(),
      kind,
    });
    notify(`${labels.title} ثبت شد و از موجودی بسته کم شد.`, "info");
    setWeightKg("");
    setCount("");
    setDescription("");
  };

  const handleClose = () => {
    setWeightKg("");
    setCount("");
    setDescription("");
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {labels.title} — بسته {toPersianDigits(purchase.batchNo ?? "")} ({fishName})
      </DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          موجودی فعلی بسته: {formatNumber(stockEntry?.remainingKg ?? 0)} کیلو
          {stockEntry?.purchasedCount > 0 && ` / ${formatNumber(stockEntry?.remainingCount ?? 0)} عدد`}
        </Typography>

        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            label="وزن (کیلو)"
            inputMode="decimal"
            value={toPersianDigits(weightKg)}
            onChange={(e) => setWeightKg(toLatinDigits(e.target.value).replace(/[^\d.]/g, ""))}
          />
          <TextField
            size="small"
            fullWidth
            label="تعداد (اختیاری)"
            inputMode="numeric"
            value={toPersianDigits(count)}
            onChange={(e) => setCount(toLatinDigits(e.target.value).replace(/[^\d]/g, ""))}
          />
        </Stack>
        <TextField
          size="small"
          fullWidth
          label={labels.descLabel}
          placeholder={labels.placeholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={2}
        />
        <Button variant="outlined" onClick={handleAdd}>
          ثبت {labels.title}
        </Button>

        {batchRecords.length > 0 && (
          <List dense sx={{ borderTop: "1px solid", borderColor: "neutral.800", pt: 1 }}>
            {batchRecords.map((l) => (
              <ListItem
                key={l.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    onClick={() => {
                      deleteLoss(l.id);
                      notify("حذف شد و به موجودی برگشت.", "info");
                    }}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${formatNumber(l.weightKg)} کیلو${
                    l.count ? ` / ${formatNumber(l.count)} عدد` : ""
                  } — ${l.description}`}
                  secondary={formatJalaliDateFa(l.date)}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="contained">
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}
