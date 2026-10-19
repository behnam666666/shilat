// src/pages/Sales/Sales.jsx
// صفحه فروش ماهی: جدول + ثبت/ویرایش/حذف + جمع خلاصه

import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "../../components/common/PageHeader";
import RecordsDataGrid from "../../components/common/RecordsDataGrid";
import ConfirmDelete from "../../components/common/ConfirmDelete";
import SaleForm from "./SaleForm";
import { buildSaleColumns } from "./SaleColumns";
import { useData } from "../../contexts/DataContext";
import { sumSales, outstandingReceivables, saleProfit } from "../../utils/accounting";
import { cardLabel } from "../../utils/payments";
import { formatToman, formatNumber } from "../../utils/format";
import { notify } from "../../utils/notificationBridge";

export default function Sales() {
  const { purchases, sales, fishTypes, cards, deleteSale } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fishNameById = useMemo(
    () => new Map(fishTypes.map((f) => [f.id, f.name])),
    [fishTypes]
  );

  const batchNoById = useMemo(
    () => new Map(purchases.map((p) => [p.id, p.batchNo])),
    [purchases]
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteSale(deleting.id);
    notify("فروش حذف شد.", "info");
    setDeleting(null);
  };

  const cardNameById = useMemo(
    () => new Map((cards ?? []).map((c) => [c.id, cardLabel(c)])),
    [cards]
  );

  const columns = useMemo(
    () =>
      buildSaleColumns({
        fishNameById,
        batchNoById,
        cardNameById,
        purchases,
        onEdit: openEdit,
        onDelete: setDeleting,
      }),
    [fishNameById, batchNoById, cardNameById, purchases]
  );

  const totals = useMemo(() => sumSales(sales), [sales]);
  const totalOutstanding = useMemo(() => outstandingReceivables(sales), [sales]);
  const totalProfit = useMemo(
    () => sales.reduce((s, r) => s + saleProfit(r, purchases), 0),
    [sales, purchases]
  );

  const summaries = [
    { label: "تعداد رکورد", value: formatNumber(totals.count) },
    { label: "جمع وزن", value: `${formatNumber(totals.weight)} کیلو` },
    { label: "جمع فروش خالص", value: formatToman(totals.net) },
    { label: "جمع سود", value: formatToman(totalProfit) },
    { label: "جمع تخفیف", value: formatToman(totals.discount) },
    { label: "جمع انعام", value: formatToman(totals.tip) },
    { label: "بدهی‌های باقی‌مانده", value: formatToman(totalOutstanding) },
  ];

  return (
    <>
      <PageHeader
        title="فروش ماهی"
        subtitle="ثبت و مدیریت فروش‌ها — وزن، قیمت، تخفیف، انعام و مطالبات"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            ثبت فروش جدید
          </Button>
        }
      />

      <RecordsDataGrid rows={sales} columns={columns} summaries={summaries} />

      {formOpen && (
        <SaleForm
          open={formOpen}
          initialValues={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDelete
        open={!!deleting}
        title="حذف فروش"
        message={`فروش ${formatNumber(deleting?.weightKg || 0)} کیلو ${
          fishNameById.get(deleting?.fishTypeId) ?? ""
        } حذف شود؟ این عمل قابل بازگشت نیست.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
