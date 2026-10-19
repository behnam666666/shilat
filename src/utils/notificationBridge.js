// src/utils/notificationBridge.js
let _notify = null;

export const setNotifier = (fn) => {
  _notify = fn;
};

export const notify = (message, severity = "success") => {
  _notify?.(message, severity);
};
