import { Card, Flex, List, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { OutletSchedule } from "../application/businessHoursModel";
import { daySummary } from "../application/businessHoursModel";

interface OutletListProps {
  readonly outlets: readonly OutletSchedule[];
  readonly selectedOutletId: string | null;
  readonly onSelect: (id: string) => void;
}

const { Text, Title } = Typography;

function outletCurrentStatus(outlet: OutletSchedule): "open" | "closed" {
  // ponytail: use real current time when backend arrives
  return outlet.regular.some((d) => d.open) ? "open" : "closed";
}

function regularSummary(outlet: OutletSchedule, t: (key: string) => string): string {
  const summaries = outlet.regular
    .filter((d) => d.open)
    .map((d) => `${t(`bh.weekdayShort.${d.weekday}`)}: ${daySummary(d)}`)
    .join("; ");
  return summaries || "";
}

function specialSummary(outlet: OutletSchedule): string | null {
  const enabled = outlet.specials.filter((s) => s.enabled);
  if (enabled.length === 0) return null;
  return enabled.map((s) => `${s.name} (${s.startDate}–${s.endDate})`).join("; ");
}

export function OutletList({ outlets, selectedOutletId, onSelect }: OutletListProps) {
  const { t } = useTranslation();

  return (
    <Flex gap="middle" vertical>
      <Title level={4}>{t("bh.outlets.title")}</Title>
      <Text type="secondary">{t("bh.outlets.timezone")}</Text>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2 }}
        dataSource={[...outlets]}
        renderItem={(outlet) => {
          const status = outletCurrentStatus(outlet);
          const isSelected = outlet.id === selectedOutletId;
          return (
            <List.Item>
              <Card
                hoverable
                role="button"
                tabIndex={0}
                aria-label={outlet.name}
                aria-pressed={isSelected}
                onClick={() => onSelect(outlet.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(outlet.id);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <Flex gap="small" vertical>
                  <Flex align="center" gap="small">
                    <Text strong>{outlet.name}</Text>
                    <Tag color={status === "open" ? "green" : "red"}>
                      {status === "open"
                        ? t("bh.outlets.statusOpen")
                        : t("bh.outlets.statusClosed")}
                    </Tag>
                  </Flex>
                  <Text type="secondary">
                    {t("bh.outlets.regularSchedule")}:{" "}
                    {regularSummary(outlet, t) || t("bh.summary.closed")}
                  </Text>
                  {specialSummary(outlet) ? (
                    <Text type="secondary">
                      {t("bh.outlets.specialSchedule")}: {specialSummary(outlet)}
                    </Text>
                  ) : (
                    <Text type="secondary">{t("bh.outlets.specialScheduleEmpty")}</Text>
                  )}
                </Flex>
              </Card>
            </List.Item>
          );
        }}
      />
    </Flex>
  );
}
