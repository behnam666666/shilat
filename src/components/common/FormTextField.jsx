// src/components/common/FormTextField.jsx
// فیلد متنی متصل به react-hook-form

import { TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";

export default function FormTextField({ name, label, ...props }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <TextField
          {...props}
          label={label}
          size="small"
          fullWidth
          value={value ?? ""}
          onChange={onChange}
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  );
}
