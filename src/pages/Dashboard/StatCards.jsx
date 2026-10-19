// src/pages/Dashboard/StatCards.jsx
// کارت‌های آماری خلاصه (stat tile)

import { Grid, Paper, Typography, Box } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import { formatToman, formatNumber } from "../../utils/format";

const StatCard = ({ label, value, hint, color = "text.primary" }) => (
  <Paper
    sx={{
      p: "12px",
      bgcolor: "neutral.900",
      border: "1px solid",
      borderColor: "neutral.800",
      borderRadius: 2,
   height:"calc(100% - 24px)"
    }}
  >
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={800} sx={{ color }}>
      {value}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        {hint}
      </Typography>
    )}
  </Paper>
);

// stats: { today, week, month, monthProfit, monthDiscount, outstanding }
export default function StatCards({ stats }) {
  const hasProfit = stats.monthProfit.profit >= 0;
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <StatCard label="فروش امروز" value={formatToman(stats.today.net)} hint={`${formatNumber(stats.today.weight)} کیلو`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <StatCard label="فروش این هفته" value={formatToman(stats.week.net)} hint={`${formatNumber(stats.week.weight)} کیلو`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <StatCard label="فروش این ماه" value={formatToman(stats.month.net)} hint={`${formatNumber(stats.month.weight)} کیلو`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <StatCard
          label="سود این ماه"
          value={formatToman(stats.monthProfit.profit)}
          color={hasProfit ? "success.main" : "error.main"}
          hint={hasProfit ? "در سود هستید" : "در ضرر هستید"}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <StatCard label="تخفیف این ماه" value={formatToman(stats.month.discount)} hint={`انعام: ${formatToman(stats.month.tip)}`} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <StatCard label="بدهی‌های باقی‌مانده" value={formatToman(stats.outstanding)} color={stats.outstanding > 0 ? "warning.main" : "text.primary"} hint="مطالبات وصول‌نشده" />
      </Grid>
    </Grid>
  );
}
