import type { PosOutlet, PosSession } from "@warungmeng/domain";
import { formatTime, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Card, Flex, InputNumber, Select, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface PosSessionBarProps {
  readonly outlets: readonly PosOutlet[];
  readonly session: PosSession;
  readonly selectedOutlet: PosOutlet;
  readonly openingBalance: number;
  readonly onOutletChange: (outlet: PosOutlet) => void;
  readonly onOpeningBalanceChange: (value: number) => void;
  readonly onStart: () => void;
  readonly onEnd: () => void;
}

export function PosSessionBar({
  outlets,
  session,
  selectedOutlet,
  openingBalance,
  onOutletChange,
  onOpeningBalanceChange,
  onStart,
  onEnd,
}: PosSessionBarProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const isOpen = session.status === "open";

  return (
    <Card className="pos-session" size="small" title={t("pos.session.title")}>
      <Flex align="end" gap="middle" wrap>
        <label className="pos-session__field">
          <Typography.Text>{t("pos.session.outlet")}</Typography.Text>
          <Select
            aria-label={t("pos.session.outlet")}
            disabled={isOpen}
            onChange={(outletId) => {
              const outlet = outlets.find((candidate) => candidate.id === outletId);
              if (outlet) onOutletChange(outlet);
            }}
            options={outlets.map((outlet) => ({ label: outlet.name, value: outlet.id }))}
            value={selectedOutlet.id}
          />
        </label>
        <label className="pos-session__field">
          <Typography.Text>{t("pos.session.openingBalance")}</Typography.Text>
          <InputNumber
            aria-label={t("pos.session.openingBalance")}
            disabled={isOpen}
            min={0}
            onChange={(value) => onOpeningBalanceChange(typeof value === "number" ? value : 0)}
            prefix="Rp"
            step={10_000}
            value={openingBalance}
          />
        </label>
        {isOpen ? (
          <>
            <Tag color="success">{t("pos.session.open")}</Tag>
            <Typography.Text type="secondary">
              {t("pos.session.openedAt", {
                time: formatTime(new Date(session.openedAt), { regionalFormat }),
              })}
            </Typography.Text>
            <Button onClick={onEnd}>{t("pos.session.end")}</Button>
          </>
        ) : (
          <>
            <Tag>{t("pos.session.closed")}</Tag>
            <Button onClick={onStart} type="primary">
              {t("pos.session.start")}
            </Button>
          </>
        )}
      </Flex>
    </Card>
  );
}
