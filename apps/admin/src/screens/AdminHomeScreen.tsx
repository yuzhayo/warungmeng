import { useTranslation } from "react-i18next";

export function AdminHomeScreen() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="admin-home-title">
      <h1 id="admin-home-title">{t("screen.home.title")}</h1>
      <p>{t("screen.home.description")}</p>
    </section>
  );
}
