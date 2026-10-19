// src/components/common/RecordsDataGrid.jsx
/* eslint-disable react-refresh/only-export-components */
// جدول مشترک رکوردها (خرید/فروش) روی @mui/x-data-grid با پیکربندی RTL و ستون‌های مالی

import { DataGrid } from "@mui/x-data-grid";
import { Box, Chip, Stack } from "@mui/material";

// رندر سلول مالی: عدد فارسی + تومان
export const moneyColumn = (field, headerName, extra = {}) => ({
  field,
  headerName,
  type: "number",
  width: 150,
  ...extra,
  valueFormatter: (value) => {
    const n = Number(value) || 0;
    return `${n.toLocaleString("en-US")}`;
  },
});

// رندر سلول وزن
export const weightColumn = (field, headerName, extra = {}) => ({
  field,
  headerName,
  type: "number",
  width: 130,
  ...extra,
  valueFormatter: (value) => {
    const n = Number(value) || 0;
    return `${n.toLocaleString("en-US")} kg`;
  },
});

// چیپ جمع خلاصه
export const SummaryChip = ({ label, value }) => (
  <Chip
    size="small"
    label={`${label}: ${value}`}
    sx={{ fontWeight: 600, bgcolor: "neutral.750", border: "1px solid", borderColor: "neutral.700" }}
  />
);

export default function RecordsDataGrid({ rows, columns, summaries, height }) {
  return (
    <Box>
      {summaries?.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
          {summaries.map((s) => (
            <SummaryChip key={s.label} label={s.label} value={s.value} />
          ))}
        </Stack>
      )}
      <Box sx={{ height: height ?? 480, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          disableRowSelectionOnClick
          hideFooterSelectedRowCount
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{
            border: "1px solid",
            borderColor: "neutral.800",
            borderRadius: 2,
            bgcolor: "neutral.900",
            "& .MuiDataGrid-columnHeaders": { bgcolor: "neutral.800" },
          }}
        />
      </Box>
    </Box>
  );
}
