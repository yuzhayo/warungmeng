import { ApplicationProviders } from "./app/ApplicationProviders";
import { AppRoutes } from "./app/AppRoutes";

export default function App() {
  return (
    <ApplicationProviders>
      <AppRoutes />
    </ApplicationProviders>
  );
}
