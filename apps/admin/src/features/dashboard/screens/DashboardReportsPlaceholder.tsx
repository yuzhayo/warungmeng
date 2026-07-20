import { Card, Empty } from "antd";
import { useTranslation } from "react-i18next";

export function DashboardReportsPlaceholder() {
  const { t } = useTranslation();

  return (
    <Card>
      <Empty
        description={t("dashboard.reports.placeholder")}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </Card>
  );
}
