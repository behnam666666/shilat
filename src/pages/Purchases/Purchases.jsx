// src/pages/Purchases/Purchases.jsx
// صفحه خرید ماهی: جدول + ثبت/ویرایش/حذف + تلفات + مصرف شخصی + بستن بسته + جمع خلاصه

import { useMemo, useState } from "react";
import { Button } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "../../components/common/PageHeader";
import RecordsDataGrid from "../../components/common/RecordsDataGrid";
import ConfirmDelete from "../../components/common/ConfirmDelete";
import PurchaseForm from "./PurchaseForm";
import LossDialog from "./LossDialog";
import CloseBatchDialog from "./CloseBatchDialog";
import { buildPurchaseColumns } from "./PurchaseColumns";
import { useData } from "../../contexts/DataContext";
import { purchaseTotal, purchaseSideCosts, batchStock } from "../../utils/accounting";
import { formatToman, formatNumber, toPersianDigits } from "../../utils/format";
import { cardLabel } from "../../utils/payments";
import { notify } from "../../utils/notificationBridge";

export default function Purchases() {
  const { purchases, sales, fishTypes, losses, cards, deletePurchase } = useData();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deductionFor, setDeductionFor] = useState(null); // { purchase, kind }
  const [closing, setClosing] = useState(null);

  const fishNameById = useMemo(
    () => new Map(fishTypes.map((f) => [f.id, f.name])),
    [fishTypes]
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
    deletePurchase(deleting.id);
    notify("خرید حذف شد.", "info");
    setDeleting(null);
  };

  const stock = useMemo(
    () => batchStock(purchases, sales, losses ?? []),
    [purchases, sales, losses]
  );

  // توضیحات تلفات و مصرف شخصی هر بسته برای tooltip ستون‌ها
  const lossesDescById = useMemo(() => {
    const map = new Map();
    (losses ?? [])
      .filter((l) => l.kind !== "personal")
      .forEach((l) => {
        const prev = map.get(l.purchaseId);
        map.set(l.purchaseId, prev ? `${prev} | ${l.description}` : l.description);
      });
    return map;
  }, [losses]);

  const personalDescById = useMemo(() => {
    const map = new Map();
    (losses ?? [])
      .filter((l) => l.kind === "personal")
      .forEach((l) => {
        const prev = map.get(l.purchaseId);
        map.set(l.purchaseId, prev ? `${prev} | ${l.description}` : l.description);
      });
    return map;
  }, [losses]);

  const cardNameById = useMemo(
    () => new Map((cards ?? []).map((c) => [c.id, cardLabel(c)])),
    [cards]
  );

  const columns = useMemo(
    () =>
      buildPurchaseColumns({
        fishNameById,
        stock,
        lossesDescById,
        personalDescById,
        cardNameById,
        onEdit: openEdit,
        onDelete: setDeleting,
        onLosses: (row, kind) => setDeductionFor({ purchase: row, kind }),
        onPersonal: (row, kind) => setDeductionFor({ purchase: row, kind }),
        onToggleClose: setClosing,
      }),
    [fishNameById, stock, lossesDescById, personalDescById, cardNameById]
  );

  const summaries = useMemo(() => {
    const totalWeight = purchases.reduce((s, p) => s + (Number(p.weightKg) || 0), 0);
    const totalAmount = purchases.reduce((s, p) => s + purchaseTotal(p), 0);
    const totalSides = purchases.reduce((s, p) => s + purchaseSideCosts(p), 0);
    const totalLost = (losses ?? [])
      .filter((l) => l.kind !== "personal")
      .reduce((s, l) => s + (Number(l.weightKg) || 0), 0);
    const totalPersonal = (losses ?? [])
      .filter((l) => l.kind === "personal")
      .reduce((s, l) => s + (Number(l.weightKg) || 0), 0);
    return [
      { label: "تعداد رکورد", value: formatNumber(purchases.length) },
      { label: "جمع وزن", value: `${formatNumber(totalWeight)} کیلو` },
      { label: "جمع خرید", value: formatToman(totalAmount) },
      { label: "جمع کرایه و هزینه", value: formatToman(totalSides) },
      { label: "جمع تلفات", value: `${formatNumber(totalLost)} کیلو` },
      { label: "جمع مصرف شخصی", value: `${formatNumber(totalPersonal)} کیلو` },
    ];
  }, [purchases, losses]);

  return (
    <>
      <PageHeader
        title="خرید ماهی"
        subtitle="ثبت و مدیریت بسته‌های خرید — وزن، تعداد، قیمت، فروشنده، تلفات و هزینه‌ها"
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openAdd}>
            ثبت خرید جدید
          </Button>
        }
      />

      <RecordsDataGrid rows={purchases} columns={columns} summaries={summaries} />

      {formOpen && (
        <PurchaseForm
          open={formOpen}
          initialValues={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      <LossDialog
        open={!!deductionFor}
        purchase={deductionFor?.purchase ?? null}
        kind={deductionFor?.kind ?? "loss"}
        fishName={fishNameById.get(deductionFor?.purchase?.fishTypeId) ?? ""}
        stockEntry={deductionFor ? stock.get(deductionFor.purchase.id) : null}
        onClose={() => setDeductionFor(null)}
      />

      <CloseBatchDialog
        open={!!closing}
        purchase={closing}
        fishName={fishNameById.get(closing?.fishTypeId) ?? ""}
        stockEntry={closing ? stock.get(closing.id) : null}
        onClose={() => setClosing(null)}
      />

      <ConfirmDelete
        open={!!deleting}
        title="حذف خرید"
        message={`بسته شماره ${toPersianDigits(deleting?.batchNo ?? "")} — ${formatNumber(
          deleting?.weightKg || 0
        )} کیلو ${fishNameById.get(deleting?.fishTypeId) ?? ""} حذف شود؟${
          sales.some((s) => s.purchaseId === deleting?.id)
            ? " فروش‌های ثبت‌شده از این بسته به «بدون بسته» تبدیل می‌شوند."
            : ""
        } این عمل قابل بازگشت نیست.`}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
