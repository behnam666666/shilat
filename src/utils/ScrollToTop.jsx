import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // با هر بار تغییر آدرس (pathname)، صفحه به مختصات صفر و صفر (بالا) اسکرول می‌شود
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto", // برای اسکرول سریع (اگر انیمیشن نرم می‌خواهید "smooth" بگذارید)
    });
  }, [pathname]);

  return null; // این کامپوننت چیزی در صفحه رندر نمی‌کند
};

export default ScrollToTop;
