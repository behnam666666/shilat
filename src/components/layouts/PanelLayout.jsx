// src/components/layouts/PanelLayout.jsx
// پوسته پنل: سایدبار راست‌چین + هدر (ساعت/تاریخ شمسی + وضعیت اتصال اکسل) + خروجی صفحه

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ShoppingBasketRoundedIcon from "@mui/icons-material/ShoppingBasketRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CloudOffRoundedIcon from "@mui/icons-material/CloudOffRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import useIranDateTime from "../../utils/useIranDateTime";
import { useData } from "../../contexts/DataContext";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: "نمای کلی", path: "/dashboard", icon: <DashboardRoundedIcon /> },
  { label: "خرید ماهی", path: "/purchases", icon: <ShoppingBasketRoundedIcon /> },
  { label: "فروش ماهی", path: "/sales", icon: <SellRoundedIcon /> },
  { label: "تنظیمات", path: "/settings", icon: <SettingsRoundedIcon /> },
];

// چیپ وضعیت ذخیره‌سازی
function StorageStatusChip() {
  const { storageMode, isFileSupported, reconnectPending } = useData();

  if (storageMode === "file") {
    return (
      <Tooltip title="تغییرات مستقیم در فایل اکسل ذخیره می‌شود">
        <Chip
          size="small"
          icon={<InsertDriveFileRoundedIcon />}
          label="متصل به فایل اکسل"
          color="success"
          variant="outlined"
        />
      </Tooltip>
    );
  }
  if (reconnectPending) {
    return (
      <Tooltip title="اجازه دسترسی به فایل اکسل قبلی داده نشده — از تنظیمات دوباره وصل شوید">
        <Chip
          size="small"
          icon={<SyncRoundedIcon />}
          label="اتصال مجدد لازم است"
          color="warning"
          variant="outlined"
        />
      </Tooltip>
    );
  }
  return (
    <Tooltip
      title={
        isFileSupported
          ? "داده‌ها در حافظه مرورگر ذخیره می‌شود — از تنظیمات به فایل اکسل وصل شوید"
          : "این مرورگر از اتصال مستقیم به فایل پشتیبانی نمی‌کند؛ از خروجی/ورودی اکسل استفاده کنید"
      }
    >
      <Chip
        size="small"
        icon={<CloudOffRoundedIcon />}
        label="حافظه محلی"
        variant="outlined"
      />
    </Tooltip>
  );
}

// محتوای سایدبار
function SidebarContent({ onNavigate }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 3, py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          component="img"
          src="/vite.svg"
          alt=""
          sx={{ width: 32, height: 32, display: { xs: "none", sm: "block" } }}
        />
        <Typography variant="h6" fontWeight={800}>
          شیلات
        </Typography>
      </Box>

      <List sx={{ px: 1.5, mt: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path);
                onNavigate?.();
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.Mui-selected": {
                  bgcolor: "primary.950",
                  "&:hover": { bgcolor: "primary.900" },
                  "& .MuiListItemIcon-root": { color: "primary.300" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <StorageStatusChip />
      </Box>
    </Box>
  );
}

export default function PanelLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { time, weekday, date } = useIranDateTime();

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      {/* سایدبار دسکتاپ — چسبیده به راست (RTL) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          anchor="left"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              bgcolor: "neutral.900",
              borderLeft: "1px solid",
              borderLeftColor: "neutral.800",
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* سایدبار موبایل */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            bgcolor: "neutral.900",
          },
        }}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* هدر */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: "rgba(16,25,34,0.85)", backdropFilter: "blur(8px)", borderBottom: "1px solid", borderColor: "neutral.800" }}
        >
          <Toolbar sx={{ gap: 1.5 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} color="inherit">
                <MenuRoundedIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" fontWeight={700}>
                {weekday} {date}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {time}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* محتوای صفحه */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
