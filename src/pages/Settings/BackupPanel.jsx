// src/pages/Settings/BackupPanel.jsx
// خروجی و ورودی اکسل + بکاپ JSON

import { Paper, Typography, Button, Stack } from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import FileUploadRoundedIcon from "@mui/icons-material/FileUploadRounded";
import DataObjectRoundedIcon from "@mui/icons-material/DataObjectRounded";
import { useData } from "../../contexts/DataContext";

export default function BackupPanel() {
  const { exportExcel, importExcel, downloadJsonBackup } = useData();

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        پشتیبان‌گیری
      </Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button variant="contained" startIcon={<FileDownloadRoundedIcon />} onClick={exportExcel}>
          خروجی اکسل
        </Button>
        <Button variant="outlined" startIcon={<FileUploadRoundedIcon />} onClick={importExcel}>
          ورود از اکسل
        </Button>
        <Button
          variant="text"
          color="inherit"
          startIcon={<DataObjectRoundedIcon />}
          onClick={downloadJsonBackup}
        >
          بکاپ JSON
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
        «ورود از اکسل» اطلاعات فعلی را با محتوای فایل انتخابی جایگزین می‌کند — قبل از آن از خروجی
        اکسل نسخه پشتیبان بگیرید.
      </Typography>
    </Paper>
  );
}
