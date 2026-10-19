// src/routes/AppRouter.jsx

import { Routes, Route, Navigate } from "react-router-dom";

import PageNotFound from "../pages/PagesNotFound/PageNotFound";
import ScrollToTop from "../utils/ScrollToTop";
import PanelLayout from "../components/layouts/PanelLayout";
import { DataProvider } from "../contexts/DataContext";

import Dashboard from "../pages/Dashboard/Dashboard";
import Purchases from "../pages/Purchases/Purchases";
import Sales from "../pages/Sales/Sales";
import Settings from "../pages/Settings/Settings";

export default function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <DataProvider>
        <Routes>
          <Route element={<PanelLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </DataProvider>
    </>
  );
}
