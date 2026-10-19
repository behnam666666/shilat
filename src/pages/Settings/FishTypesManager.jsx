// src/pages/Settings/FishTypesManager.jsx
// مدیریت مدل‌های ماهی: افزودن و حذف

import { useState } from "react";
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Stack,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useData } from "../../contexts/DataContext";
import { notify } from "../../utils/notificationBridge";

export default function FishTypesManager() {
  const { fishTypes, addFishType, deleteFishType, purchases, sales } = useData();
  const [newName, setNewName] = useState("");

  // مدل‌هایی که رکوردی از آن‌ها وجود دارد حذف نمی‌شوند
  const usedIds = new Set([
    ...purchases.map((p) => p.fishTypeId),
    ...sales.map((s) => s.fishTypeId),
  ]);

  const handleAdd = () => {
    if (addFishType(newName)) {
      notify("مدل ماهی اضافه شد.");
    }
    setNewName("");
  };

  const handleDelete = (fishType) => {
    deleteFishType(fishType.id);
    notify(`مدل «${fishType.name}» حذف شد.`, "info");
  };

  return (
    <Paper sx={{ p: 3, bgcolor: "neutral.900", border: "1px solid", borderColor: "neutral.800", borderRadius: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        مدل‌های ماهی
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          label="نام مدل جدید"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={handleAdd} disabled={!newName.trim()}>
          افزودن
        </Button>
      </Stack>

      <List dense>
        {fishTypes.map((f) => (
          <ListItem
            key={f.id}
            secondaryAction={
              <Tooltip
                title={
                  usedIds.has(f.id)
                    ? "این مدل در رکوردهای خرید/فروش استفاده شده و حذف نمی‌شود"
                    : "حذف مدل"
                }
              >
                <span>
                  <IconButton
                    edge="end"
                    size="small"
                    color="error"
                    disabled={usedIds.has(f.id)}
                    onClick={() => handleDelete(f)}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            }
            sx={{ borderBottom: "1px solid", borderColor: "neutral.800" }}
          >
            <ListItemText primary={f.name} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
