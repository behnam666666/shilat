// src/pages/Dashboard/SalesTrendChart.jsx
// نمودار روند فروش به تفکیک دوره (روز/هفته/ماه) — تک‌سری با رنگ اسلات ۱

import { useMemo, useState } from "react";
import { Paper, Typography, ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { totalsByPeriod } from "../../utils/accounting";
import { toPersianDigits } from "../../utils/format";

// رنگ‌های تأییدشده برای سطح تیره (خطای دیده‌بانی پالت چک شده)
const SERIES_1 = "#3987e5"; // آبی
const TEXT_PRIMARY = "#e2e8f0";
const TEXT_SECONDARY = "#94a3b8";
const GRID_COLOR = "rgba(148, 163, 184, 0.1)";
const SURFACE = "#1e293b";

const GRANULARITY_LABELS = { day: "روزانه", week: "هفتگی", month: "ماهانه" };

// برچسب محور x از کلید دوره (1404-06 → ۰۶/۲۹)
const keyToLabel = (key, granularity) => {
  const parts = key.split("-");
  if (granularity === "month") return toPersianDigits(parts[0].slice(2)) + "/" + toPersianDigits(parts[1]);
  return toPersianDigits(parts[1]) + "/" + toPersianDigits(parts[2]);
};

const formatTomanShort = (v) => `${toPersianDigits(Number(v).toLocaleString("en-US"))} تومان`;

// تولتیپ سفارشی خوانا
const CustomTooltip = ({ value, label }) => (
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
    <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY }}>{label}</Typography>
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>
      {formatTomanShort(value)}
    </Typography>
  </Box>
);

export default function SalesTrendChart({ sales }) {
  const [granularity, setGranularity] = useState("day");

  const data = useMemo(() => {
    const totals = totalsByPeriod(sales, granularity);
    // نمایش ۱۲ دوره آخر
    return totals.slice(-12).map(([key, t]) => ({
      period: keyToLabel(key, granularity),
      net: Math.round(t.net),
    }));
  }, [sales, granularity]);

  // وقتی تیک‌ها زیاد می‌شوند یکی در میان نمایش داده شوند تا شلوغ نشود
  const tickValues = useMemo(
    () => (data.length > 8 ? data.filter((_, i) => i % 2 === 0).map((d) => d.period) : undefined),
    [data]
  );

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          روند فروش (تومان)
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={granularity}
          onChange={(_, v) => v && setGranularity(v)}
        >
          {Object.entries(GRANULARITY_LABELS).map(([key, label]) => (
            <ToggleButton key={key} value={key}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {data.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
          هنوز فروشی ثبت نشده است
        </Typography>
      ) : (
        <Box sx={{ height: 340 }}>
          <ResponsiveBar
  data={data}
  keys={["net"]}
  indexBy="period"
  margin={{ top: 32, right: 8, bottom: 52, left: 76 }}
  padding={0.3}
  colors={[SERIES_1]}
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
  axisBottom={{
    tickSize: 0,
    tickPadding: 10,
    tickValues,
    legend: "تاریخ",
    legendPosition: "middle",
    legendOffset: 38,
    // پراپرتی نامعتبر color از اینجا حذف شد
  }}
  axisLeft={{
    tickSize: 0,
    tickPadding: 8,
    legend: "تومان",
    legendPosition: "middle",
    legendOffset: -60,
    format: (v) => toPersianDigits(v.toLocaleString("en-US")),
  }}
  tooltip={({ value, indexValue }) => <CustomTooltip value={value} label={indexValue} />}
  enableLabel={data.length <= 8}
  label={(d) => toPersianDigits(Number(d.value).toLocaleString("en-US"))}
  labelTextColor={TEXT_PRIMARY}
/>

        </Box>
      )}
    </Paper>
  );
}
