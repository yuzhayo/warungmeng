import { Outlet } from "react-router-dom";
import { StorefrontHeader } from "./StorefrontHeader";
import styles from "./StorefrontShell.module.css";

export function StorefrontShell() {
  return (
    <div className={styles.shell}>
      <StorefrontHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
