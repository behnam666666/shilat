// src/components/common/FormModal.jsx
// پوسته مشترک مودال فرم‌ها (افزودن/ویرایش) با react-hook-form
// فرزندها داخل FormProvider رندر می‌شوند و با useFormContext به فرم دسترسی دارند.
// برای بازنشانی درست هنگام ویرایش، والد باید مودال را با key={record?.id ?? "new"} بسازد.

import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

export default function FormModal({ open, title, form, onClose, maxWidth = "sm" }) {
  const { schema, defaultValues, onSubmit } = form;
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onTouched",
  });
  const { handleSubmit, reset } = methods;

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const submit = async (values) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(submit)} noValidate>
          <DialogContent dividers sx={{ display: "grid", gap: 2 }}>
            {form.children}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleClose} color="inherit">
              انصراف
            </Button>
            <Button type="submit" variant="contained">
              ذخیره
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </Dialog>
  );
}
