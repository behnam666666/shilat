// src/pages/Dashboard/FishTypeProfitChart.jsx
// سود به تفکیک مدل ماهی — رنگ بر اساس علامت (سود/ضرر) + برچسب مستقیم مقدارها
// (جفت سبز/قرمز در محدوده هشدار CVD است؛ جهت میله از خط صفر و برچسب مقدار، کدگذاری دوم است)

import { useMemo } from "react";
import { Paper, Typography, Box, Stack, Chip } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { totalsByFishType } from "../../utils/accounting";
import { toPersianDigits } from "../../utils/format";

const PROFIT_GREEN = "#199e70";
const PROFIT_GREEN_HOVER = "#23b584";
const LOSS_RED = "#e66767";
const LOSS_RED_HOVER = "#ef8282";
const TEXT_PRIMARY = "#e2e8f0";
const GRID_COLOR = "rgba(148, 163, 184, 0.1)";
const SURFACE = "#1e293b";
const TEXT_SECONDARY = "#94a3b8";


const formatTomanShort = (v) => `${toPersianDigits(Number(v).toLocaleString("en-US"))} تومان`;

const CustomTooltip = ({ color, value, label }) => (
  <Box
    sx={{
      bgcolor: SURFACE,
      border: "1px solid rgba(148,163,184,0.25)",
      borderRadius: 1.5,
      px: 1.5,
      py: 1,
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      direction: "rtl",
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.25 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
      <Typography sx={{ fontSize: 11, color: "#94a3b8" }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
      {formatTomanShort(value)}
    </Typography>
  </Box>
);

export default function FishTypeProfitChart({ purchases, sales, losses = [], fishTypes }) {
  const data = useMemo(
    () =>
      totalsByFishType({ purchases, sales, losses }, fishTypes).map((t) => ({
        fishType: t.fishType.name,
        profit: Math.round(t.profit),
        revenue: Math.round(t.revenue),
      })),
    [purchases, sales, losses, fishTypes]
  );

  const hasAnyData = data.some((d) => d.revenue !== 0 || d.profit !== 0);

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          سود به تفکیک مدل ماهی (تومان)
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip size="small" variant="outlined" sx={{ color: PROFIT_GREEN, borderColor: PROFIT_GREEN }} label="سود" />
          <Chip size="small" variant="outlined" sx={{ color: LOSS_RED, borderColor: LOSS_RED }} label="ضرر" />
        </Stack>
      </Stack>

      {!hasAnyData ? (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
          هنوز خرید یا فروشی ثبت نشده است
        </Typography>
      ) : (
        <Box sx={{ height: 340 }}>
          <ResponsiveBar
            data={data}
            keys={["profit"]}
            indexBy="fishType"
            margin={{ top: 32, right: 8, bottom: 44, left: 76 }}
            padding={0.4}
            borderRadius={4}
            enableGridY
            theme={{
              textColor: TEXT_PRIMARY,
              fontSize: 12,
               // 👇 تنظیم استایل و رنگ متن‌های محورها
    axis: {
      ticks: {
        text: {
          fill: TEXT_SECONDARY, // رنگ اعداد و تاریخ‌های روی محور (06/28 و مقادیر سمت چپ)
          fontSize: 12,
        },
      },
      legend: {
        text: {
          fill: TEXT_PRIMARY, // رنگ عناوین محورها ("تاریخ" و "تومان")
          fontSize: 13,
          fontWeight: 600,
        },
      },
    },
              grid: { line: { stroke: GRID_COLOR, strokeWidth: 1 } },
              tooltip: { container: { background: "transparent", boxShadow: "none", fontSize: 12 } },
            }}
            // رنگ هر میله بر اساس علامت سود + رنگ روشن‌تر هنگام هاور
            colorBy={(d) => (d.data.profit >= 0 ? PROFIT_GREEN : LOSS_RED)}
            axisBottom={{ tickSize: 0, tickPadding: 10 }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              legend: "تومان",
              legendPosition: "middle",
              legendOffset: -60,
              format: (v) => toPersianDigits(v.toLocaleString("en-US")),
            }}
            tooltip={({ color, value, indexValue }) => (
              <CustomTooltip color={color} value={value} label={indexValue} />
            )}
            // کدگذاری دوم: برچسب مستقیم مقدار روی هر میله
            enableLabel
            label={(d) => toPersianDigits(Math.abs(d.value).toLocaleString("en-US"))}
            labelTextColor="#f1f5f9"
            labelSkipWidth={16}
            labelSkipHeight={16}
          />
        </Box>
      )}
    </Paper>
  );
}
