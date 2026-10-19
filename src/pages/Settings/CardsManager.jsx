// src/pages/Settings/CardsManager.jsx
// مدیریت کارت‌های بانکی: افزودن و حذف کارت برای تفکیک حساب‌ها

import { useState } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Stack,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useData } from "../../contexts/DataContext";
import { cardLabel } from "../../utils/payments";
import { toLatinDigits, toPersianDigits } from "../../utils/format";
import { notify } from "../../utils/notificationBridge";

export default function CardsManager() {
  const { cards, addCard, deleteCard, purchases, sales } = useData();
  const [bankName, setBankName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [holder, setHolder] = useState("");

  // کارت‌هایی که رکوردی از آن‌ها هست حذف نمی‌شوند
  const usedIds = new Set([
    ...purchases.map((p) => p.cardId),
    ...sales.map((s) => s.cardId),
  ]);

  const handleAdd = () => {
    if (addCard({ bankName, cardNumber: toLatinDigits(cardNumber), holder })) {
      notify("کارت اضافه شد.");
      setBankName("");
      setCardNumber("");
      setHolder("");
    }
  };

  const handleDelete = (card) => {
    deleteCard(card.id);
    notify(`کارت «${cardLabel(card)}» حذف شد.`, "info");
  };

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        کارت‌های بانکی
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        کارت‌ها برای تفکیک حساب‌ها استفاده می‌شوند — در فرم خرید و فروش نحوه پرداخت و کارت را انتخاب
        می‌کنی و گزارش هر کارت جداگانه در داشبورد می‌آید.
      </Typography>

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            label="نام بانک"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            label="شماره کارت (یا ۴ رقم آخر)"
            value={toPersianDigits(cardNumber)}
            onChange={(e) =>
              setCardNumber(toLatinDigits(e.target.value).replace(/\D/g, "").slice(0, 16))
            }
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            label="به نام (اختیاری)"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleAdd}
            disabled={!bankName.trim()}
            sx={{ whiteSpace: "nowrap" }}
          >
            افزودن
          </Button>
        </Stack>
      </Stack>

      <List dense>
        {(cards ?? []).map((c) => (
          <ListItem
            key={c.id}
            secondaryAction={
              <Tooltip
                title={usedIds.has(c.id) ? "این کارت در رکوردها استفاده شده و حذف نمی‌شود" : "حذف کارت"}
              >
                <span>
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    disabled={usedIds.has(c.id)}
                    onClick={() => handleDelete(c)}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            }
            sx={{ borderBottom: "1px solid", borderColor: "neutral.800" }}
          >
            <ListItemText
              primary={cardLabel(c)}
              secondary={c.holder ? `به نام ${c.holder}` : undefined}
            />
          </ListItem>
        ))}
        {(!cards || cards.length === 0) && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            هنوز کارتی اضافه نشده است
          </Typography>
        )}
      </List>
    </Paper>
  );
}
