import { useTranslation } from "react-i18next";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export function NotFoundScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title={t("storefront.notFound.title")}
      subTitle={t("storefront.notFound.description")}
      extra={
        <Button type="primary" onClick={() => navigate("/")}>
          {t("storefront.notFound.back")}
        </Button>
      }
    />
  );
}
