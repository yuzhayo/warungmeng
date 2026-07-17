import { AdminUiProvider } from "@warungmeng/ui-admin";
import { HashRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";

export default function App() {
  return (
    <AdminUiProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AdminUiProvider>
  );
}
