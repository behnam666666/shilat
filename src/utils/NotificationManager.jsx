import { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { setNotifier } from "./notificationBridge";

export default function NotificationManager() {
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    setNotifier((message, severity = "success") =>
      setNotif({ message, severity })
    );
    return () => setNotifier(null);
  }, []);

  return (
    <Snackbar
      open={!!notif}
      autoHideDuration={3500}
      onClose={() => setNotif(null)}
      anchorOrigin={{ vertical: "top", horizontal: "left" }}
    >
      <Alert
        severity={notif?.severity ?? "info"}
        variant="filled"
        onClose={() => setNotif(null)}
      >
        {notif?.message}
      </Alert>
    </Snackbar>
  );
}
