// src/pages/Dashboard/StockChart.jsx
// دو نمودار کمکی داشبورد: مقایسه خرید/فروش به تفکیک مدل ماهی + سهم نحوه پرداخت

import { useMemo } from "react";
import { Paper, Typography, Box } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { stockByFishType, saleNet } from "../../utils/accounting";
import { PAYMENT_METHODS } from "../../utils/payments";
import { toPersianDigits } from "../../utils/format";

const TEXT_PRIMARY = "#e2e8f0";
const TEXT_SECONDARY = "#94a3b8";
const GRID_COLOR = "rgba(148, 163, 184, 0.1)";
const SURFACE = "#1e293b";

const formatTomanShort = (v) => `${toPersianDigits(Number(v).toLocaleString("en-US"))} تومان`;
const formatKgShort = (v) => `${toPersianDigits(Number(v).toLocaleString("en-US"))} کیلو`;

const TooltipBox = ({ color, label, value }) => (
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
      {color && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />}
      <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY }}>{label}</Typography>
    </Box>
    <Typography sx={{ fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY }}>{value}</Typography>
  </Box>
);

// رنگ‌های تأییدشده پالت (اسلات ۱ تا ۴) — ترتیب داده طوری است که زرد و نارنجی مجاور نشوند
const SLOT_COLORS = ["#3987e5", "#d95926", "#199e70", "#c98500"];

// ---------- مقایسه خرید و فروش (کیلو) به تفکیک مدل ماهی ----------

export function StockComparisonChart({ purchases, sales, fishTypes }) {
  const data = useMemo(
    () =>
      stockByFishType({ purchases, sales }, fishTypes)
        .filter((s) => s.purchasedKg > 0 || s.soldKg > 0)
        .map((s) => ({
          fishType: s.fishType.name,
          "خریداری‌شده": Math.round(s.purchasedKg),
          "فروخته‌شده": Math.round(s.soldKg),
        })),
    [purchases, sales, fishTypes]
  );

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        خرید و فروش به تفکیک مدل ماهی (کیلوگرم)
      </Typography>
      {data.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
          هنوز خریدی ثبت نشده است
        </Typography>
      ) : (
        <Box sx={{ height: 320 }}>
          <ResponsiveBar
            data={data}
            keys={["خریداری‌شده", "فروخته‌شده"]}
            indexBy="fishType"
            margin={{ top: 40, right: 8, bottom: 44, left: 64 }}
            padding={0.35}
            groupMode="grouped"
            colors={["#3987e5", "#199e70"]}
            borderRadius={4}
            enableGridY
            theme={{
              textColor: TEXT_PRIMARY,
              fontSize: 12,
              grid: { line: { stroke: GRID_COLOR, strokeWidth: 1 } },
              tooltip: { container: { background: "transparent", boxShadow: "none", fontSize: 12 } },
            }}
            axisBottom={{ tickSize: 0, tickPadding: 10 }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 8,
              format: (v) => toPersianDigits(v.toLocaleString("en-US")),
            }}
            tooltip={({ color, id, value, indexValue }) => (
              <TooltipBox color={color} label={`${indexValue} — ${id}`} value={formatKgShort(value)} />
            )}
            legends={[
              {
                dataFrom: "keys",
                anchor: "top-right",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: -28,
                itemWidth: 90,
                itemHeight: 18,
                symbolSize: 10,
                symbolShape: "circle",
                itemTextColor: TEXT_SECONDARY,
              },
            ]}
          />
        </Box>
      )}
    </Paper>
  );
}

// ---------- سهم نحوه پرداخت در فروش‌ها ----------

export function PaymentMethodPie({ sales }) {
  const data = useMemo(() => {
    const byMethod = new Map();
    sales.forEach((s) => {
      const key = s.paymentMethod || "cash";
      byMethod.set(key, (byMethod.get(key) || 0) + saleNet(s));
    });
    // ترتیب ثابت مطابق PAYMENT_METHODS تا رنگ هر نحوه پرداخت همیشه یکسان بماند
    return PAYMENT_METHODS.filter((m) => (byMethod.get(m.value) || 0) > 0).map((m) => ({
      id: m.label,
      value: Math.round(byMethod.get(m.value)),
      color: SLOT_COLORS[PAYMENT_METHODS.findIndex((x) => x.value === m.value) % SLOT_COLORS.length],
    }));
  }, [sales]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        سهم نحوه پرداخت (تومان)
      </Typography>
      {data.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
          هنوز فروشی ثبت نشده است
        </Typography>
      ) : (
        <Box sx={{ height: 320, position: "relative" }}>
          <ResponsivePie
            data={data}
            margin={{ top: 36, right: 8, bottom: 36, left: 8 }}
            innerRadius={0.6}
            padAngle={2}
            cornerRadius={4}
            colors={{ datum: "data.color" }}
            borderWidth={0}
            enableArcLabels
            arcLabel={(d) => toPersianDigits(Math.round((d.value / total) * 100)) + "٪"}
            arcLabelsTextColor="#ffffff"
            arcLabelsSkipAngle={8}
            enableArcLinkLabels={false}
            theme={{
              textColor: TEXT_PRIMARY,
              fontSize: 12,
              tooltip: { container: { background: "transparent", boxShadow: "none", fontSize: 12 } },
            }}
            tooltip={({ datum: { color, label, value } }) => (
              <TooltipBox color={color} label={label} value={formatTomanShort(value)} />
            )}
            legends={[
              {
                anchor: "top-right",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: -26,
                itemWidth: 90,
                itemHeight: 18,
                symbolSize: 10,
                symbolShape: "circle",
                itemTextColor: TEXT_SECONDARY,
              },
            ]}
          />
          {/* عدد وسط دونات: جمع فروش */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              جمع فروش
            </Typography>
            <Typography fontWeight={800} sx={{ color: TEXT_PRIMARY }}>
              {formatTomanShort(total)}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
