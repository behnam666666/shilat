// src/pages/Settings/Settings.jsx

import { Box, Grid } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import FishTypesManager from "./FishTypesManager";
import CardsManager from "./CardsManager";
import StoragePanel from "./StoragePanel";
import BackupPanel from "./BackupPanel";

export default function Settings() {
  return (
    <>
      <PageHeader
        title="تنظیمات"
        subtitle="مدیریت مدل‌های ماهی، کارت‌های بانکی، اتصال به فایل اکسل و پشتیبان‌گیری"
      />
      <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Box sx={{ display: "grid", gap: 3 }}>
          <FishTypesManager />
          <CardsManager />
        </Box>
        <Box sx={{ display: "grid", gap: 3 }}>
          <StoragePanel />
          <BackupPanel />
        </Box>
      </Box>
    </>
  );
}
