// src/api/apiClient.js
import axios from "axios";

import { fetchEventSource } from '@microsoft/fetch-event-source';
import { notify } from "../utils/notificationBridge";

/**
 * پیشنهاد:
 * .env
 * VITE_API_BASE_URL=http://192.168.6.214:8001/api
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

/* ===========================
   Token helpers
=========================== */

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// ✅ ساده‌ترین راه در یه فایل non-component
const redirectToLogin = () => {
  // console.log("rrrrrr")
  clearTokens();
  // window.location.href = "/login"; // hard redirect
};

/* ===========================
   Request interceptor (attach access token)
=========================== */

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ===========================
   Refresh token logic (auto)
=========================== */

let isRefreshing = false;
let refreshSubscribers = [];

// وقتی توکن جدید اومد، درخواست‌هایی که منتظر بودن رو ادامه میدیم
const onRefreshed = (newAccessToken) => {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

/**
 * ✅ درخواست رفرش توکن
 * این تابع از refreshToken استفاده می‌کنه و accessToken جدید می‌گیره.
 * ⚠️ endpoint را مطابق بک‌اندت درست کن
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  // برای اینکه interceptor لوپ نشه، از axios خام استفاده می‌کنیم
  const baseURL = api.defaults.baseURL;

  // ✅ یکی از اینا رو نگه دار (بسته به بک‌اندت)
  // const refreshUrl = `${baseURL}/auth/refresh-token`;
  const refreshUrl = `${baseURL}/auth/refresh-token`;

  const res = await axios.post(
    refreshUrl,
    { refreshToken },
    { headers: { "Content-Type": "application/json" }, timeout: 15000 }
  );

  // انتظار داریم مثل لاگین accessToken/refreshToken بده
  const newAccessToken = res.data?.accessToken;
  const newRefreshToken = res.data?.refreshToken;

  if (!newAccessToken) {
    throw new Error("Refresh did not return accessToken");
  }

  setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};


//───── تابع کمکی تشخیص severity بر اساس status ─────
const getSeverity = (status) => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 400 && status < 500) return "warning";
  return "error"; // 5xx
};


/**
 * Response interceptor:
 * اگر 401 خوردیم، یک بار سعی می‌کنیم رفرش کنیم و درخواست قبلی را تکرار کنیم
 */
api.interceptors.response.use(
  (response) =>  {
    

    const message = response?.data?.message;

    if(response?.config?.method=="get"){
          return response;

    }


    // فقط اگه message داشت نمایش بده (GET های خالی رو ignore می‌کنه)
    if (message) {
      notify(message, getSeverity(response.status));
    }
    return response;
  },
  
  async (error) => {
    // console.log(error?.response?.data?.message)
    // const message = error?.response?.data?.message;
    // فقط اگه message داشت نمایش بده (GET های خالی رو ignore می‌کنه)
    console.log(error?.response)
    if (error?.response?.data?.message) {
      notify(error?.response?.data?.message, getSeverity(error?.response?.status));
    }

    const originalRequest = error?.config;

    // اگر خطا 401 بود و قبلاً تلاش نکرده بودیم
    if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // اگر refreshToken نداریم -> لاگ اوت
      if (!getRefreshToken()) {
        redirectToLogin();
        return Promise.reject(error);
      }

      // علامت گذاری که دوباره وارد لوپ نشه
      originalRequest._retry = true;

      // اگر همین الان یکی داره refresh می‌کنه، بقیه درخواست‌ها منتظر بمونن
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newAccessToken) => {
             if (!newAccessToken) return reject(error);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const { accessToken: newAccessToken } = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newAccessToken);

        // درخواست اصلی رو با توکن جدید تکرار کن
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshed(null); // ❌ به subscribers خبر بده که fail شد
        redirectToLogin(); // ✅ redirect

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

/* ===========================
   AUTH
=========================== */

export const registerAdvisor = async (formData) => {
  const payload = {
    name: formData?.name,
    role: formData?.role,
    phoneNumber: formData?.phone,
    password: formData?.password,
  };

  const res = await api.post("/auth/register", payload);
  return res.data;
};

export const verifyOtp = async ({ phoneNumber, code }) => {
  const res = await api.post("/auth/verify-otp", { phoneNumber, code });

  // اگر بک‌اند بعد verifyOtp هم توکن داد، ذخیره کن
  if (res.data?.accessToken || res.data?.refreshToken) {
    setTokens({
      accessToken: res.data?.accessToken,
      refreshToken: res.data?.refreshToken,
    });
  }

  return res.data;
};

export const login = async ({ phoneNumber, password }) => {
  const res = await api.post("/auth/login", { phoneNumber, password });

  // ✅ طبق خروجی جدیدت
  setTokens({
    accessToken: res.data?.data?.accessToken,
    refreshToken: res.data?.data?.refreshToken,
  });

  return res.data;
};

export const forgotPassword = async ({ phoneNumber }) => {
  const res = await api.post("/auth/forgot-password", { phoneNumber });
  return res.data;
};

export const verifyResetOtp = async ({ phoneNumber, code }) => {
  const res = await api.post("/auth/verify-reset-otp", { phoneNumber, code });
  return res.data;
};

export const resetPassword = async ({ resetToken, newPassword }) => {
  const res = await api.post("/auth/reset-password", { resetToken, newPassword });
  return res.data;
};

export const logout = async () => {
  // بعضی بک‌اندها توکن را لازم دارند (Authorization) که interceptor خودش می‌ذاره
  const res = await api.post("/auth/logout");

  // پاک کردن توکن‌ها سمت کلاینت
  clearTokens();

  return res.data;
};

export const getAuthStatus = async () => {
  const res = await api.get("/auth/status");
  return res.data;
};




