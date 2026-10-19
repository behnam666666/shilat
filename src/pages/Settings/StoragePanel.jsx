// src/pages/Settings/StoragePanel.jsx
// اتصال به فایل اکسل و نمایش وضعیت ذخیره‌سازی

import { Paper, Typography, Button, Stack, Chip, Alert } from "@mui/material";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import { useData } from "../../contexts/DataContext";

export default function StoragePanel() {
  const {
    storageMode,
    isFileSupported,
    reconnectPending,
    connectFile,
    reconnectFile,
    disconnectFile,
    isDirty,
    lastSaved,
  } = useData();

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        ذخیره‌سازی اطلاعات
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Chip
          size="small"
          color={storageMode === "file" ? "success" : "default"}
          variant="outlined"
          icon={<InsertDriveFileRoundedIcon />}
          label={storageMode === "file" ? "متصل به فایل اکسل" : "حافظه محلی مرورگر"}
        />
        {isDirty && <Chip size="small" label="تغییرات ذخیره نشده" color="warning" variant="outlined" />}
        {lastSaved && !isDirty && (
          <Typography variant="caption" color="text.secondary">
            آخرین ذخیره: {new Date(lastSaved).toLocaleTimeString("fa-IR")}
          </Typography>
        )}
      </Stack>

      {reconnectPending && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button size="small" variant="contained" onClick={reconnectFile}>
              اتصال مجدد
            </Button>
          }
        >
          فایل اکسل قبلی نیاز به اجازه دسترسی دوباره دارد.
        </Alert>
      )}

      {!isFileSupported && (
        <Alert severity="info" sx={{ mb: 2 }}>
          این مرورگر از اتصال مستقیم به فایل پشتیبانی نمی‌کند. از خروجی/ورودی اکسل در بخش
          پشتیبان‌گیری استفاده کنید (کروم یا اج پیشنهاد می‌شود).
        </Alert>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {storageMode === "file" ? (
          <Button variant="outlined" color="warning" startIcon={<LinkOffRoundedIcon />} onClick={disconnectFile}>
            قطع اتصال فایل
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<InsertDriveFileRoundedIcon />}
            onClick={connectFile}
            disabled={!isFileSupported}
          >
            اتصال به فایل اکسل
          </Button>
        )}
        {reconnectPending && (
          <Button variant="outlined" startIcon={<SyncRoundedIcon />} onClick={reconnectFile}>
            اتصال مجدد به فایل قبلی
          </Button>
        )}
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        وقتی فایل اکسل متصل باشد، هر تغییر بلافاصله در همان فایل ذخیره می‌شود و می‌توانید آن را در
        اکسل باز کنید. حافظه مرورگر هم به عنوان بکاپ همیشه به‌روز می‌ماند.
      </Typography>
    </Paper>
  );
}
