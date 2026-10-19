// src/pages/Sales/SaleColumns.jsx

import { Box, IconButton, Tooltip } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { formatJalaliDateFa, formatToman, formatNumber, toPersianDigits } from "../../utils/format";
import { paymentMethodLabel } from "../../utils/payments";
import { saleNet, saleOutstanding, saleProfit } from "../../utils/accounting";

// تعریف ستون‌های جدول فروش
export const buildSaleColumns = ({ fishNameById, batchNoById, cardNameById, purchases = [], onEdit, onDelete }) => [
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
    field: "purchaseId",
    headerName: "بسته",
    width: 90,
    renderCell: ({ row }) =>
      batchNoById.get(row.purchaseId) ? (
        <Box sx={{ fontWeight: 700, color: "primary.300" }}>
          {toPersianDigits(batchNoById.get(row.purchaseId))}
        </Box>
      ) : (
        <Box sx={{ color: "text.disabled" }}>—</Box>
      ),
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
    field: "pricePerKg",
    headerName: "قیمت هر کیلو",
    type: "number",
    width: 150,
    valueFormatter: (value) => formatToman(value),
  },
  {
    field: "net",
    headerName: "مبلغ کل",
    type: "number",
    width: 150,
    valueGetter: (value, row) => saleNet(row),
    renderCell: ({ row }) => (
      <Box sx={{ fontWeight: 700, color: "success.main" }}>{formatToman(saleNet(row))}</Box>
    ),
  },
  {
    field: "discount",
    headerName: "تخفیف",
    type: "number",
    width: 130,
    valueFormatter: (value) => (Number(value) ? formatToman(value) : "—"),
  },
  {
    field: "tip",
    headerName: "انعام",
    type: "number",
    width: 130,
    valueFormatter: (value) => (Number(value) ? formatToman(value) : "—"),
  },
  {
    field: "paid",
    headerName: "پرداخت‌شده",
    type: "number",
    width: 150,
    valueFormatter: (value) => formatToman(value),
  },
  {
    field: "profit",
    headerName: "سود",
    type: "number",
    width: 140,
    valueGetter: (value, row) => saleProfit(row, purchases),
    renderCell: ({ row }) => {
      const profit = saleProfit(row, purchases);
      return (
        <Box sx={{ fontWeight: 700, color: profit >= 0 ? "success.main" : "error.main" }}>
          {formatToman(profit)}
        </Box>
      );
    },
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
          {card && <Box sx={{ fontSize: 12, color: "text.secondary" }}>{card}</Box>}
        </Box>
      );
    },
  },
  {
    field: "outstanding",
    headerName: "بدهی",
    type: "number",
    width: 130,
    valueGetter: (value, row) => saleOutstanding(row),
    renderCell: ({ row }) =>
      saleOutstanding(row) > 0 ? (
        <Box sx={{ color: "warning.main" }}>{formatToman(saleOutstanding(row))}</Box>
      ) : (
        "—"
      ),
  },
  {
    field: "customer",
    headerName: "مشتری",
    width: 150,
  },
  {
    field: "notes",
    headerName: "توضیحات",
    width: 200,
  },
  {
    field: "actions",
    headerName: "عملیات",
    width: 110,
    sortable: false,
    renderCell: ({ row }) => (
      <Box>
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
