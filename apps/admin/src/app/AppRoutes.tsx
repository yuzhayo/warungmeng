import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../components/layout/AdminShell";
import { AdminHomeScreen } from "../screens/AdminHomeScreen";
import { AdminPlaceholderScreen } from "../screens/AdminPlaceholderScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AdminShell />}>
        <Route index element={<AdminHomeScreen />} />
        <Route
          path="menu"
          element={
            <AdminPlaceholderScreen
              description="Daftar menu dan kategori akan ditampilkan di sini."
              title="Pengaturan Menu"
            />
          }
        />
        <Route
          path="finance"
          element={
            <AdminPlaceholderScreen
              description="Ringkasan saldo dan transaksi outlet."
              title="Keuangan"
            />
          }
        />
        <Route
          path="calculator"
          element={
            <AdminPlaceholderScreen description="Perhitungan HPP dan pajak." title="Calculator" />
          }
        />
        <Route
          path="orders"
          element={
            <AdminPlaceholderScreen
              description="Pengelolaan pesanan outlet."
              title="Manajemen Pesanan"
            />
          }
        />
        <Route
          path="settings"
          element={
            <AdminPlaceholderScreen
              description="Pengaturan operasional dan tampilan aplikasi."
              title="Pengaturan"
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
