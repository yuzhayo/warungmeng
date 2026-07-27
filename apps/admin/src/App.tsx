import { HashRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";
import { adminRuntime, type AdminRuntime } from "./app/composition/adminRuntime";
import { AdminApplicationProviders } from "./app/providers/AdminApplicationProviders";

export interface AppProps {
  readonly runtime?: AdminRuntime;
}

export default function App({ runtime = adminRuntime }: AppProps) {
  return (
    <AdminApplicationProviders runtime={runtime}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AdminApplicationProviders>
  );
}
