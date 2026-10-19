// src/pages/Dashboard/InventoryTable.jsx
// موجودی انبار به تفکیک مدل ماهی + جزئیات بسته‌ها (سود و باقی‌مانده هر بسته)

import { useMemo, useState } from "react";
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Box,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFnsJalali } from "@mui/x-date-pickers/AdapterDateFnsJalali";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { faIR } from "date-fns-jalali/locale";
import { formatToman, formatNumber, toPersianDigits } from "../../utils/format";
import { cardLabel, cardsSummary, cashSummary } from "../../utils/payments";
import { batchProfit, periodKey, toDate } from "../../utils/accounting";

const Th = ({ children, align = "right" }) => (
  <TableCell sx={{ fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" }} align={align}>
    {children}
  </TableCell>
);

const Td = ({ children, align = "right", sx }) => (
  <TableCell sx={{ whiteSpace: "nowrap", ...sx }} align={align}>
    {children}
  </TableCell>
);

// جدول سود هر بسته خرید
export function BatchProfitTable({ purchases, sales, losses, fishNameById }) {
  const rows = buildBatchRows(purchases, sales, losses);

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        سود هر بسته خرید (تومان)
      </Typography>
      {rows.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          هنوز خریدی ثبت نشده است
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <Th>بسته</Th>
                <Th>مدل ماهی</Th>
                <Th>فروشنده</Th>
                <Th>بهای هر کیلو</Th>
                <Th>وزن خرید</Th>
                <Th>فروخته‌شده</Th>
                <Th>تلفات</Th>
                <Th>مصرف شخصی</Th>
                <Th>باقی‌مانده</Th>
                <Th>بهای تمام‌شده کل</Th>
                <Th>فروش خالص</Th>
                <Th>سود تحقق‌یافته</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.purchase.id} sx={r.purchase.closed ? { opacity: 0.55 } : undefined}>
                  <Td>
                    <Box sx={{ fontWeight: 700, color: "primary.300" }}>
                      {toPersianDigits(r.purchase.batchNo ?? "—")}
                    </Box>
                    {r.purchase.closed && (
                      <Box sx={{ fontSize: 11, color: "warning.main" }}>تمام‌شده</Box>
                    )}
                  </Td>
                  <Td>{fishNameById.get(r.purchase.fishTypeId) ?? "—"}</Td>
                  <Td>{r.purchase.seller || "—"}</Td>
                  <Td>{formatToman(r.costPerKg)}</Td>
                  <Td>
                    {formatNumber(r.purchase.weightKg)} کیلو
                    {r.purchase.count > 0 && (
                      <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>
                        {" "}
                        / {formatNumber(r.purchase.count)} عدد
                      </Box>
                    )}
                  </Td>
                  <Td>
                    {formatNumber(r.soldKg)} کیلو
                    {r.purchase.count > 0 && (
                      <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>
                        {" "}
                        / {formatNumber(r.soldCount)} عدد
                      </Box>
                    )}
                  </Td>
                  <Td>
                    {r.lostKg > 0 ? (
                      <Tooltip title={r.batchLosses.map((l) => l.description).join(" | ")}>
                        <Box sx={{ color: "error.main" }}>
                          {formatNumber(r.lostKg)} کیلو
                          <Box component="span" sx={{ fontSize: 12 }}>
                            {r.lostCost > 0 ? ` (${formatToman(r.lostCost)})` : ""}
                          </Box>
                        </Box>
                      </Tooltip>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {r.personalKg > 0 ? (
                      <Tooltip title={r.batchPersonal.map((d) => d.description).join(" | ")}>
                        <Box sx={{ color: "warning.main" }}>
                          {formatNumber(r.personalKg)} کیلو
                          <Box component="span" sx={{ fontSize: 12 }}>
                            {r.personalCost > 0 ? ` (${formatToman(r.personalCost)})` : ""}
                          </Box>
                        </Box>
                      </Tooltip>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    {r.remainingKg < 0 ? (
                      <Tooltip title="مجموع فروش و تلفات از وزن خرید اولیه بیشتر شده (رشد ماهی)">
                        <Box sx={{ color: "warning.main" }}>
                          {formatNumber(-r.remainingKg)}+ کیلو (رشد)
                        </Box>
                      </Tooltip>
                    ) : (
                      <Box sx={{ color: r.remainingKg > 0 ? "success.main" : "text.disabled" }}>
                        {formatNumber(r.remainingKg)} کیلو
                        {r.purchase.count > 0 && (
                          <Box component="span" sx={{ fontSize: 12 }}>
                            {" "}
                            / {formatNumber(r.remainingCount)} عدد
                          </Box>
                        )}
                      </Box>
                    )}
                  </Td>
                  <Td>{formatToman(r.totalCost)}</Td>
                  <Td>{formatToman(r.revenue)}</Td>
                  <Td>
                    <Tooltip title="فروش خالص منهای بهای وزن فروخته‌شده و تلفات همین بسته">
                      <Box sx={{ fontWeight: 700, color: r.profit >= 0 ? "success.main" : "error.main" }}>
                        {formatToman(r.profit)}
                      </Box>
                    </Tooltip>
                  </Td>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}

const buildBatchRows = (purchases, sales, losses = []) =>
  purchases
    .map((p) => batchProfit({ purchases, sales, losses }, p.id))
    .filter(Boolean)
    .sort((a, b) => (b.purchase.batchNo ?? 0) - (a.purchase.batchNo ?? 0));

// گزینه‌های فیلتر دوره حساب‌های بانکی
const PERIOD_OPTIONS = [
  { value: "today", label: "امروز", granularity: "day" },
  { value: "week", label: "این هفته", granularity: "week" },
  { value: "month", label: "این ماه", granularity: "month" },
  { value: "day", label: "روز مشخص", granularity: "day" },
];

// جدول حساب‌های بانکی: پول ورودی/خروجی و سود هر کارت — با فیلتر دوره
export function CardsTable({ purchases, sales, cards }) {
  const [mode, setMode] = useState("month");
  const [day, setDay] = useState(new Date());

  const summary = useMemo(() => {
    const option = PERIOD_OPTIONS.find((o) => o.value === mode);
    // روز مرجع: امروز، یا روزی که کاربر انتخاب کرده
    const refDate = mode === "day" ? toDate(day) : new Date();
    const refKey = periodKey(refDate, option.granularity);

    const inPeriod = (records) =>
      records.filter((r) => periodKey(r.date, option.granularity) === refKey);

    // جریان پول از رکوردهای فیلترشده، ولی بهای تمام‌شده همیشه از کل خریدها
    // (ماهی ممکن است چند روز قبل خریده شده باشد)
    return cardsSummary(
      { purchases: inPeriod(purchases), sales: inPeriod(sales), allPurchases: purchases },
      cards ?? []
    );
  }, [purchases, sales, cards, mode, day]);

  const cash = useMemo(() => {
    const option = PERIOD_OPTIONS.find((o) => o.value === mode);
    const refDate = mode === "day" ? toDate(day) : new Date();
    const refKey = periodKey(refDate, option.granularity);

    const inPeriod = (records) =>
      records.filter((r) => periodKey(r.date, option.granularity) === refKey);

    return cashSummary({
      purchases: inPeriod(purchases),
      sales: inPeriod(sales),
      allPurchases: purchases,
    });
  }, [purchases, sales, mode, day]);

  const hasCards = summary.length > 0;

  // مجموع کل: جمع همه کارت‌ها + نقدی (برای ردیف آخر جدول)
  const totalRow = useMemo(() => {
    const sum = (key) =>
      summary.reduce((s, r) => s + r[key], 0) + (cash?.[key] || 0);
    return {
      moneyIn: sum("moneyIn"),
      moneyOut: sum("moneyOut"),
      net: sum("net"),
      profit: sum("profit"),
    };
  }, [summary, cash]);

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          حساب‌های بانکی (تومان)
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {mode === "day" && (
            <LocalizationProvider dateAdapter={AdapterDateFnsJalali} adapterLocale={faIR}>
              <DatePicker
                label="انتخاب روز"
                value={day}
                onChange={(d) => d && setDay(d)}
                slotProps={{ textField: { size: "small", sx: { width: 160 } } }}
              />
            </LocalizationProvider>
          )}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={mode}
            onChange={(_, v) => v && setMode(v)}
          >
            {PERIOD_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </Box>

      {!hasCards ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          هنوز کارتی اضافه نشده — از تنظیمات کارت‌های بانکی‌ات را اضافه کن
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <Th>کارت / حساب</Th>
                <Th>ورودی (فروش)</Th>
                <Th>خروجی (خرید)</Th>
                <Th>خالص</Th>
                <Th>
                  <Tooltip title="سود فروش‌های این بازه به نسبت پولی که واقعاً واریز شده — فروش نسیه تا وقتی پولش واریز نشود در سود واریزی حساب نمی‌شود">
                    <Box component="span">سود واریزی</Box>
                  </Tooltip>
                </Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {summary?.map((s) => (
                <TableRow key={s.card.id}>
                  <Td>
                    <Box sx={{ fontWeight: 700 }}>{cardLabel(s.card)}</Box>
                    {s.card.holder && (
                      <Box sx={{ fontSize: 12, color: "text.secondary" }}>به نام {s.card.holder}</Box>
                    )}
                  </Td>
                  <Td sx={{ color: "success.main" }}>{formatToman(s.moneyIn)}</Td>
                  <Td sx={{ color: "error.main" }}>{formatToman(s.moneyOut)}</Td>
                  <Td sx={{ fontWeight: 700 }}>{formatToman(s.net)}</Td>
                  <Td>
                    <Box sx={{ fontWeight: 700, color: s.profit >= 0 ? "success.main" : "error.main" }}>
                      {formatToman(s.profit)}
                    </Box>
                  </Td>
                </TableRow>
              ))}
              {cash && (cash.moneyIn > 0 || cash.moneyOut > 0) && (
                <TableRow>
                  <Td>
                    <Box sx={{ fontWeight: 700 }}>نقدی</Box>
                    <Box sx={{ fontSize: 12, color: "text.secondary" }}>پرداخت‌های دستی</Box>
                  </Td>
                  <Td sx={{ color: "success.main" }}>{formatToman(cash.moneyIn)}</Td>
                  <Td sx={{ color: "error.main" }}>{formatToman(cash.moneyOut)}</Td>
                  <Td sx={{ fontWeight: 700 }}>{formatToman(cash.moneyIn - cash.moneyOut)}</Td>
                  <Td>
                    <Box
                      sx={{ fontWeight: 700, color: cash.profit >= 0 ? "success.main" : "error.main" }}
                    >
                      {formatToman(cash.profit)}
                    </Box>
                  </Td>
                </TableRow>
              )}

              {/* ردیف مجموع کل: همه کارت‌ها + نقدی */}
              <TableRow sx={{ bgcolor: "primary.950", "& > td": { borderTop: "2px solid", borderTopColor: "primary.900" } }}>
                <Td>
                  <Box sx={{ fontWeight: 800, color: "primary.300" }}>مجموع کل</Box>
                  <Box sx={{ fontSize: 12, color: "text.secondary" }}>
                    {summary.length} کارت + نقدی
                  </Box>
                </Td>
                <Td>
                  <Box sx={{ fontWeight: 800, color: "success.main" }}>
                    {formatToman(totalRow.moneyIn)}
                  </Box>
                </Td>
                <Td>
                  <Box sx={{ fontWeight: 800, color: "error.main" }}>
                    {formatToman(totalRow.moneyOut)}
                  </Box>
                </Td>
                <Td>
                  <Box sx={{ fontWeight: 800 }}>{formatToman(totalRow.net)}</Box>
                </Td>
                <Td>
                  <Box
                    sx={{
                      fontWeight: 800,
                      color: totalRow.profit >= 0 ? "success.main" : "error.main",
                    }}
                  >
                    {formatToman(totalRow.profit)}
                  </Box>
                </Td>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}

// جدول موجودی به تفکیک مدل ماهی
export function InventoryTable({ stock }) {
  const hasData = stock.some((s) => s.purchasedKg > 0 || s.soldKg > 0);

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        موجودی انبار
      </Typography>
      {!hasData ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          هنوز خرید یا فروشی ثبت نشده است
        </Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <Th>مدل ماهی</Th>
                <Th>خریداری‌شده</Th>
                <Th>فروخته‌شده</Th>
                <Th>تلفات</Th>
                <Th>مصرف شخصی</Th>
                <Th>موجودی</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {stock
                .filter((s) => s.purchasedKg > 0 || s.soldKg > 0 || s.lostKg > 0 || s.personalKg > 0)
                .map((s) => (
                  <TableRow key={s.fishType.id}>
                    <Td>
                      <Box sx={{ fontWeight: 700 }}>{s.fishType.name}</Box>
                    </Td>
                    <Td>{formatNumber(s.purchasedKg)} کیلو</Td>
                    <Td>{formatNumber(s.soldKg)} کیلو</Td>
                    <Td>
                      {s.lostKg > 0 ? (
                        <Box sx={{ color: "error.main" }}>{formatNumber(s.lostKg)} کیلو</Box>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      {s.personalKg > 0 ? (
                        <Box sx={{ color: "warning.main" }}>{formatNumber(s.personalKg)} کیلو</Box>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>
                      {s.remainingKg < 0 ? (
                        <Tooltip title="مجموع فروش و تلفات و مصرف از خرید بیشتر شده (رشد ماهی)">
                          <Box sx={{ fontWeight: 700, color: "warning.main" }}>
                            {formatNumber(-s.remainingKg)}+ کیلو (رشد)
                          </Box>
                        </Tooltip>
                      ) : (
                        <Box
                          sx={{
                            fontWeight: 700,
                            color: s.remainingKg > 0 ? "success.main" : "text.disabled",
                          }}
                        >
                          {formatNumber(s.remainingKg)} کیلو
                        </Box>
                      )}
                    </Td>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}
