// src/pages/Dashboard/Dashboard.jsx
// نمای کلی: کارت‌های آماری + نمودارها + موجودی انبار + سود هر بسته خرید

import { useMemo } from "react";
import { Stack, Alert, Button, Grid } from "@mui/material";
import StatCards from "./StatCards";
import SalesTrendChart from "./SalesTrendChart";
import FishTypeProfitChart from "./FishTypeProfitChart";
import { InventoryTable, BatchProfitTable, CardsTable } from "./InventoryTable";
import { StockComparisonChart, PaymentMethodPie } from "./StockChart";
import { useData } from "../../contexts/DataContext";
import {
  sumSales,
  salesToday,
  salesThisWeek,
  salesThisMonth,
  outstandingReceivables,
  profitForSales,
  stockByFishType,
} from "../../utils/accounting";

export default function Dashboard() {
  const { purchases, sales, fishTypes, losses, cards, storageMode, isFileSupported, connectFile } =
    useData();

  const stats = useMemo(() => {
    const today = sumSales(salesToday(sales));
    const week = sumSales(salesThisWeek(sales));
    const month = sumSales(salesThisMonth(sales));
    const monthProfit = profitForSales({ purchases, sales: salesThisMonth(sales), losses });
    return {
      today,
      week,
      month,
      monthProfit,
      outstanding: outstandingReceivables(sales),
    };
  }, [purchases, sales, losses]);

  const stock = useMemo(
    () => stockByFishType({ purchases, sales, losses }, fishTypes),
    [purchases, sales, losses, fishTypes]
  );

  const fishNameById = useMemo(
    () => new Map(fishTypes.map((f) => [f.id, f.name])),
    [fishTypes]
  );

  return (
    <>
      {/* راهنمای اتصال فایل در حالت حافظه محلی */}
      {storageMode === "local" && isFileSupported && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button size="small" variant="contained" onClick={connectFile}>
              اتصال به فایل
            </Button>
          }
        >
          برای ذخیره مستقیم اطلاعات در فایل اکسل، از تنظیمات یا دکمه کنار به فایل وصل شوید.
        </Alert>
      )}

      <Stack spacing={3}>
        <StatCards stats={stats} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <SalesTrendChart sales={sales} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <FishTypeProfitChart
              purchases={purchases}
              sales={sales}
              losses={losses}
              fishTypes={fishTypes}
            />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <StockComparisonChart purchases={purchases} sales={sales} fishTypes={fishTypes} />
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <PaymentMethodPie sales={sales} />
          </Grid>
        </Grid>
        <InventoryTable stock={stock} />
        <BatchProfitTable
          purchases={purchases}
          sales={sales}
          losses={losses}
          fishNameById={fishNameById}
        />
        <CardsTable purchases={purchases} sales={sales} cards={cards} />
      </Stack>
    </>
  );
}
