import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  getAuthStatus,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from "../services/apiClient"; // مسیرت رو درست کن

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true); // همون loading اولیه برای status

  const [studyPlanId, setStudyPlanId] = useState(null);
  const [mentorShipId, setMentorShipId] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);

  const [subscriptionStatusAi , setSubscriptionStatusAi] = useState(null)



  const isAuthenticated = !!user; // معیار اصلی (بهتر از فقط توکن)

  // ✅ در شروع اپ: اگه توکن داریم، وضعیت را از سرور چک کن
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const hasAnyToken = !!getAccessToken() || !!getRefreshToken();

      if (!hasAnyToken) {
        if (!cancelled) {
          setUser(null);
          setChecking(false);
        }
        return;
      }

      try {
        const status = await getAuthStatus();
        // بسته به خروجی بک‌اندت این خط ممکنه فرق کنه:
        // مثلا: status.user یا status.data.user یا status.profile
        const nextUser = status?.user ?? status?.data?.user ?? status?.data ?? status;
      // console.log(nextUser)

        if (!cancelled) setUser(nextUser || null);
      } catch (err) {
        // اگر توکن نامعتبر/منقضی بود
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ login از طریق API خودت
  async function login({ phoneNumber, password }) {
    // apiClient خودش setTokens می‌کنه
    const res = await apiLogin({ phoneNumber, password });

    // اگر بک‌اند توی login یوزر برمی‌گردونه، از همون استفاده کن
    const maybeUser = res?.user ?? res?.data?.user;

    if (maybeUser) {
      // console.log(maybeUser)
      setUser(maybeUser);
      return res;
    }

    // اگر یوزر برنمی‌گردونه، بعد لاگین یک status بزن
    const status = await getAuthStatus();
    const nextUser = status?.user ?? status?.data?.user ??  status?.data ?? status;
      // console.log(nextUser)

    setUser(nextUser || null);

    return res;
  }

  // ✅ logout
  async function logout() {
    try {
      await apiLogout(); // این خودش clearTokens رو هم انجام میده توی apiClient
    } catch (e) {
      // اگر سرور خطا داد هم ما سمت کلاینت پاک می‌کنیم
      clearTokens();
    } finally {
      setUser(null);
    }
  }

  // ✅ برای وقتی می‌خوای دستی sync کنی
  async function refreshAuthStatus() {
    setChecking(true);
    try {
      const status = await getAuthStatus();
      const nextUser = status?.user ?? status?.data?.user ?? status?.data ?? status;
      // console.log(nextUser)
      
      setUser(nextUser || null);
    } catch (e) {
      clearTokens();
      setUser(null);
    } finally {
      setChecking(false);
    }
  }

  console.log(user)
  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated,
      checking,
      studyPlanId,
      setStudyPlanId,
      mentorShipId,
      setMentorShipId,
      login,
      logout,
      refreshAuthStatus,
      dailyReport,
      setDailyReport,
      subscriptionStatusAi,
      setSubscriptionStatusAi
    }),
    [user, isAuthenticated, checking,studyPlanId,mentorShipId , dailyReport , subscriptionStatusAi]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

