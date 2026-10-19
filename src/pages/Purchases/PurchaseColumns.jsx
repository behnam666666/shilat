// src/pages/Purchases/PurchaseColumns.jsx

import { Box, IconButton, Tooltip, Chip } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import { formatJalaliDateFa, formatToman, formatNumber, toPersianDigits } from "../../utils/format";
import { paymentMethodLabel } from "../../utils/payments";
import { purchaseTotal, purchaseSideCosts, batchCostPerKg, batchAvgWeightKg } from "../../utils/accounting";

// تعریف ستون‌های جدول خرید
export const buildPurchaseColumns = ({
  fishNameById,
  stock,
  lossesDescById,
  personalDescById,
  cardNameById,
  onEdit,
  onDelete,
  onLosses,
  onPersonal,
  onToggleClose,
}) => [
  {
    field: "batchNo",
    headerName: "بسته",
    width: 110,
    renderCell: ({ row }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Box sx={{ fontWeight: 700, color: row.closed ? "text.disabled" : "primary.300" }}>
          {toPersianDigits(row.batchNo ?? "—")}
        </Box>
        {row.closed && <Chip size="small" label="تمام‌شده" color="warning" variant="outlined" />}
      </Box>
    ),
  },
  {
    field: "date",
    headerName: "تاریخ",
    width: 170,
    renderCell: ({ row }) => {
      const date = formatJalaliDateFa(row.date);
      const time = String(row.date || "").slice(11, 16);
      return (
        <Box>
          <Box>{date}</Box>
          {time && (
            <Box sx={{ fontSize: 12, color: "text.secondary" }}>{toPersianDigits(time)}</Box>
          )}
        </Box>
      );
    },
  },
  {
    field: "fishTypeId",
    headerName: "مدل ماهی",
    width: 140,
    renderCell: ({ row }) => fishNameById.get(row.fishTypeId) ?? "—",
  },
  {
    field: "weightKg",
    headerName: "وزن (کیلو)",
    type: "number",
    width: 120,
    valueFormatter: (value) => formatNumber(value),
  },
  {
    field: "count",
    headerName: "تعداد",
    type: "number",
    width: 100,
    valueFormatter: (value) => (Number(value) ? formatNumber(value) : "—"),
  },
  {
    field: "avgWeightKg",
    headerName: "میانگین وزن هر ماهی",
    type: "number",
    width: 170,
    valueGetter: (value, row) => batchAvgWeightKg(row),
    renderCell: ({ row }) => {
      const avg = batchAvgWeightKg(row);
      return avg !== null ? `${formatNumber(avg)} کیلو` : "—";
    },
  },
  {
    field: "pricePerKg",
    headerName: "قیمت هر کیلو",
    type: "number",
    width: 150,
    valueFormatter: (value) => formatToman(value),
  },
  {
    field: "costPerKg",
    headerName: "بهای هر کیلو",
    type: "number",
    width: 150,
    valueGetter: (value, row) => batchCostPerKg(row),
    renderCell: ({ row }) => (
      <Tooltip title="قیمت خرید + کرایه و هزینه‌ها، تقسیم بر وزن">
        <Box>{formatToman(batchCostPerKg(row))}</Box>
      </Tooltip>
    ),
  },
  {
    field: "total",
    headerName: "مبلغ کل",
    type: "number",
    width: 150,
    valueGetter: (value, row) => purchaseTotal(row),
    renderCell: ({ row }) => (
      <Box sx={{ fontWeight: 700, color: "primary.300" }}>{formatToman(purchaseTotal(row))}</Box>
    ),
  },
  {
    field: "seller",
    headerName: "فروشنده",
    width: 150,
  },
  {
    field: "transportCost",
    headerName: "کرایه",
    type: "number",
    width: 130,
    valueFormatter: (value) => formatToman(value),
  },
  {
    field: "otherCosts",
    headerName: "هزینه‌های دیگر",
    type: "number",
    width: 150,
    valueFormatter: (value) => formatToman(value),
  },
  {
    field: "sideTotal",
    headerName: "جمع هزینه‌ها",
    type: "number",
    width: 150,
    valueGetter: (value, row) => purchaseSideCosts(row),
    renderCell: ({ row }) => formatToman(purchaseSideCosts(row)),
  },
  {
    field: "paymentMethod",
    headerName: "نحوه پرداخت",
    width: 130,
    renderCell: ({ row }) => {
      const label = paymentMethodLabel(row.paymentMethod);
      const card = cardNameById.get(row.cardId);
      return (
        <Box>
          <Box>{label}</Box>
          {card && (
            <Box sx={{ fontSize: 12, color: "text.secondary" }}>{card}</Box>
          )}
        </Box>
      );
    },
  },
  {
    field: "lostKg",
    headerName: "تلفات",
    type: "number",
    width: 120,
    valueGetter: (value, row) => stock.get(row.id)?.lostKg ?? 0,
    renderCell: ({ row }) => {
      const lost = stock.get(row.id)?.lostKg ?? 0;
      const desc = lossesDescById.get(row.id);
      return lost > 0 ? (
        <Tooltip title={desc ?? ""}>
          <Box sx={{ color: "error.main" }}>{formatNumber(lost)} کیلو</Box>
        </Tooltip>
      ) : (
        <Box sx={{ color: "text.disabled" }}>—</Box>
      );
    },
  },
  {
    field: "personalKg",
    headerName: "مصرف شخصی",
    type: "number",
    width: 120,
    valueGetter: (value, row) => stock.get(row.id)?.personalKg ?? 0,
    renderCell: ({ row }) => {
      const personal = stock.get(row.id)?.personalKg ?? 0;
      const desc = personalDescById.get(row.id);
      return personal > 0 ? (
        <Tooltip title={desc ?? ""}>
          <Box sx={{ color: "warning.main" }}>{formatNumber(personal)} کیلو</Box>
        </Tooltip>
      ) : (
        <Box sx={{ color: "text.disabled" }}>—</Box>
      );
    },
  },
  {
    field: "remainingKg",
    headerName: "موجودی باقی‌مانده",
    type: "number",
    width: 170,
    valueGetter: (value, row) => (stock.get(row.id)?.remainingKg ?? Number(row.weightKg)) || 0,
    renderCell: ({ row }) => {
      const remaining = (stock.get(row.id)?.remainingKg ?? Number(row.weightKg)) || 0;
      // موجودی منفی یعنی مجموع فروش از خرید اولیه بیشتر شده (رشد ماهی) — خطا نیست
      if (remaining < 0) {
        return (
          <Tooltip title="مجموع فروش و تلفات از وزن خرید اولیه بیشتر شده (رشد ماهی)">
            <Box sx={{ color: "warning.main" }}>{formatNumber(-remaining)}+ کیلو (رشد)</Box>
          </Tooltip>
        );
      }
      return (
        <Box sx={{ color: remaining > 0 ? "success.main" : "text.disabled" }}>
          {formatNumber(remaining)} کیلو
        </Box>
      );
    },
  },
  {
    field: "notes",
    headerName: "توضیحات",
    width: 200,
  },
  {
    field: "actions",
    headerName: "عملیات",
    width: 220,
    sortable: false,
    renderCell: ({ row }) => (
      <Box>
        <Tooltip title="ثبت تلفات این بسته">
          <IconButton size="small" color="warning" onClick={() => onLosses(row, "loss")}>
            <WarningAmberRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="ثبت مصرف شخصی این بسته">
          <IconButton size="small" color="info" onClick={() => onPersonal(row, "personal")}>
            <PersonRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={row.closed ? "بازکردن بسته (تمام‌شده)" : "بستن بسته (تمام شد)"}>
          <IconButton size="small" onClick={() => onToggleClose(row)}>
            {row.closed ? <LockOpenRoundedIcon fontSize="small" /> : <LockRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="ویرایش">
          <IconButton size="small" onClick={() => onEdit(row)}>
            <EditRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="حذف">
          <IconButton size="small" color="error" onClick={() => onDelete(row)}>
            <DeleteRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    ),
  },
];
