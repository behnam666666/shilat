// src/components/common/ConfirmDelete.jsx

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";

export default function ConfirmDelete({ open, title, message, onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title ?? "تأیید حذف"}</DialogTitle>
      <DialogContent>
        {message ?? "آیا از حذف این رکورد مطمئن هستید؟ این عمل قابل بازگشت نیست."}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          انصراف
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error">
          حذف
        </Button>
      </DialogActions>
    </Dialog>
  );
}
