import { Alert, Button, Card, Col, Empty, Result, Row, Skeleton, Space } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { DashboardReportDataResult } from "../application/useDashboardReportData";

export interface DashboardDataStateProps {
  readonly children: ReactNode;
  readonly data: DashboardReportDataResult;
  readonly isEmpty: boolean;
  readonly missingCostItemCount: number;
}

export function DashboardLoadingState() {
  return (
    <Space className="dashboard-state-stack" orientation="vertical" size="large">
      <Row gutter={[16, 16]}>
        {Array.from({ length: 8 }, (_, index) => (
          <Col key={index} xs={24} sm={12} xl={6}>
            <Card size="small">
              <Skeleton active paragraph={{ rows: 1 }} title={{ width: "55%" }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    </Space>
  );
}

export function DashboardDataState({
  children,
  data,
  isEmpty,
  missingCostItemCount,
}: DashboardDataStateProps) {
  const { t } = useTranslation();

  if (data.status === "loading") return <DashboardLoadingState />;
  if (data.status === "error") {
    return (
      <Result
        extra={
          <Button loading={data.retrying} onClick={data.retry} type="primary">
            {t("dashboard.action.retry")}
          </Button>
        }
        status="error"
        subTitle={t("dashboard.error.description")}
        title={t("dashboard.error.title")}
      />
    );
  }

  return (
    <Space className="dashboard-state-stack" orientation="vertical" size="large">
      {data.status === "partial" ? (
        <Alert
          action={
            <Button loading={data.retrying} onClick={data.retry} size="small">
              {t("dashboard.action.retry")}
            </Button>
          }
          description={data.failedSources
            .map((source) => t(`dashboard.source.${source}`))
            .join(", ")}
          title={t("dashboard.warning.partial")}
          showIcon
          type="warning"
        />
      ) : null}
      {missingCostItemCount > 0 ? (
        <Alert
          description={t("dashboard.warning.missingCostDescription", {
            count: missingCostItemCount,
          })}
          title={t("dashboard.warning.missingCost")}
          showIcon
          type="warning"
        />
      ) : null}
      {isEmpty ? (
        <Card>
          <Empty
            description={t("dashboard.empty.description")}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        children
      )}
    </Space>
  );
}
