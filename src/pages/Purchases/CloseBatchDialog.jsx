// src/pages/Purchases/CloseBatchDialog.jsx
// بستن بسته خرید — وقتی ماهی‌های یک خرید تمام می‌شود
// اگر هنوز موجودی مانده باشد، کاربر می‌تواند آن را همزمان به عنوان تلفات ثبت کند.

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useData } from "../../contexts/DataContext";
import { formatNumber, nowLocalIso } from "../../utils/format";
import { notify } from "../../utils/notificationBridge";

export default function CloseBatchDialog({ open, purchase, fishName, stockEntry, onClose }) {
  const { closePurchase, reopenPurchase, addLoss } = useData();
  const [remainingAsLoss, setRemainingAsLoss] = useState(true);
  const [description, setDescription] = useState("");

  if (!purchase) return null;

  const isClosed = !!purchase.closed;
  const remainingKg = (stockEntry?.remainingKg ?? Number(purchase.weightKg)) || 0;
  const remainingCount = stockEntry?.remainingCount ?? 0;

  const handleConfirm = () => {
    if (isClosed) {
      reopenPurchase(purchase.id);
      notify("بسته دوباره باز شد.", "info");
      onClose?.();
      return;
    }
    // اگر موجودی مانده و کاربر خواست، به عنوان تلفات ثبت می‌شود
    if (remainingAsLoss && remainingKg > 0) {
      addLoss({
        purchaseId: purchase.id,
        date: nowLocalIso(),
        weightKg: remainingKg,
        count: remainingCount > 0 ? remainingCount : null,
        description:
          description.trim() ||
          `بسته بسته شد — باقی‌مانده ${formatNumber(remainingKg)} کیلو به عنوان تلفات`,
      });
      notify("بسته بسته شد و باقی‌مانده به عنوان تلفات ثبت شد.", "info");
    } else {
      notify("بسته به عنوان تمام‌شده علامت خورد.", "info");
    }
    closePurchase(purchase.id);
    setDescription("");
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isClosed ? "بازکردن بسته" : `بستن بسته ${purchase.batchNo ?? ""}`}
      </DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
        {isClosed ? (
          <Typography>
            این بسته قبلاً به عنوان تمام‌شده علامت خورده. دوباره باز شود تا بتوان از آن فروش ثبت کرد؟
          </Typography>
        ) : (
          <>
            <Typography>
              بسته {fishName} ({formatNumber(purchase.weightKg)} کیلو) به عنوان تمام‌شده علامت بخورد و
              از فهرست فروش حذف شود؟
            </Typography>
            {remainingKg > 0 && (
              <Box sx={{ display: "grid", gap: 2 }}>
                <Typography color="warning.main">
                  هنوز {formatNumber(remainingKg)} کیلو
                  {remainingCount > 0 ? ` / ${formatNumber(remainingCount)} عدد` : ""} موجودی ثبت‌شده
                  دارد.
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={remainingAsLoss}
                      onChange={(e) => setRemainingAsLoss(e.target.checked)}
                    />
                  }
                  label="باقی‌مانده به عنوان تلفات ثبت شود (از موجودی و سود حساب می‌شود)"
                />
                {remainingAsLoss && (
                  <TextField
                    size="small"
                    fullWidth
                    label="توضیحات تلفات"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="مثلاً خراب شد / به حساب خریدار نیست"
                  />
                )}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          انصراف
        </Button>
        <Button onClick={handleConfirm} variant="contained" color={isClosed ? "primary" : "warning"}>
          {isClosed ? "بازکردن بسته" : "بستن بسته"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
