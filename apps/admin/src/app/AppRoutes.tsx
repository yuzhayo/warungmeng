import { Navigate, Route, Routes } from "react-router-dom";
import { AdminHomeScreen } from "../screens/AdminHomeScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminHomeScreen />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
