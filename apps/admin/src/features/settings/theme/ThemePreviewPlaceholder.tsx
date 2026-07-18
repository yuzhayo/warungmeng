import { Card, Empty } from "antd";
import { useTranslation } from "react-i18next";

export function ThemePreviewPlaceholder() {
  const { t } = useTranslation();

  return (
    <Card
      style={{ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: "20rem" }}
      styles={{ body: { display: "grid", flex: 1, placeItems: "center" } }}
      title={t("theme.preview.title")}
    >
      <Empty description={t("theme.preview.placeholder")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
    </Card>
  );
}
