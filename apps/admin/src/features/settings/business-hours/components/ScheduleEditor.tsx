import { Button, Flex, Input, Switch, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type {
  DaySchedule,
  ValidationError,
  TouchedFields,
} from "../application/businessHoursModel";
import { shouldShowRangeErrors, shouldShowDayErrors } from "../application/businessHoursModel";

interface ScheduleEditorProps {
  readonly days: readonly DaySchedule[];
  readonly editMode: "readonly" | "editing";
  readonly saveAttempted: boolean;
  readonly touched: TouchedFields;
  readonly getDayErrors: (weekday: string) => ValidationError[];
  readonly onUpdateDayOpen: (weekday: string, open: boolean) => void;
  readonly onUpdateRangeTime: (
    weekday: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ) => void;
  readonly onAddRange: (weekday: string) => void;
  readonly onRemoveRange: (weekday: string, rangeId: string) => void;
}

const { Text } = Typography;

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function ScheduleEditor({
  days,
  editMode,
  saveAttempted,
  touched,
  getDayErrors,
  onUpdateDayOpen,
  onUpdateRangeTime,
  onAddRange,
  onRemoveRange,
}: ScheduleEditorProps) {
  const { t } = useTranslation();

  return (
    <Flex gap="middle" vertical>
      {WEEKDAY_KEYS.map((wd) => {
        const day = days.find((d) => d.weekday === wd);
        if (!day) return null;
        const dayLabel = t(`bh.weekday.${wd}`);
        const shortLabel = t(`bh.weekdayShort.${wd}`);
        const dayErrors = getDayErrors(wd);
        const showDayErrors = shouldShowDayErrors(touched, saveAttempted, wd);

        return (
          <Flex aria-label={t("bh.day.ranges", { day: dayLabel })} gap="small" key={wd} vertical>
            <Flex align="center" gap="small">
              {editMode === "editing" ? (
                <Switch
                  aria-label={t("bh.day.switch", { day: dayLabel })}
                  checked={day.open}
                  onChange={(v) => onUpdateDayOpen(wd, v)}
                />
              ) : (
                <Tag color={day.open ? "green" : undefined}>
                  {day.open ? t("bh.day.open") : t("bh.day.closed")}
                </Tag>
              )}
              <Text strong>{dayLabel}</Text>
            </Flex>

            {day.open ? (
              <Flex gap="small" vertical>
                {day.ranges.map((range, idx) => {
                  const showStartError = shouldShowRangeErrors(
                    touched,
                    saveAttempted,
                    range.id,
                    "start",
                  );
                  const showEndError = shouldShowRangeErrors(
                    touched,
                    saveAttempted,
                    range.id,
                    "end",
                  );
                  const rangeErrors = dayErrors.filter((e) =>
                    e.path.startsWith(`range.${range.id}`),
                  );
                  const startError = showStartError
                    ? rangeErrors.find(
                        (e) =>
                          e.code === "timeFormat" ||
                          e.code === "endTime2400" ||
                          e.code === "startBeforeEnd",
                      )
                    : undefined;
                  const endError = showEndError
                    ? rangeErrors.find(
                        (e) => e.code === "endTime2400" || e.code === "startBeforeEnd",
                      )
                    : undefined;

                  return (
                    <Flex align="center" gap="small" key={range.id}>
                      {editMode === "editing" ? (
                        <>
                          <Text>{t("bh.day.start")}</Text>
                          <Input
                            aria-label={t("bh.day.startFor", { day: shortLabel, index: idx + 1 })}
                            size="small"
                            status={startError ? "error" : undefined}
                            value={range.start}
                            onChange={(e) =>
                              onUpdateRangeTime(wd, range.id, "start", e.target.value)
                            }
                            style={{ maxWidth: 100 }}
                          />
                          <Text>{t("bh.day.end")}</Text>
                          <Input
                            aria-label={t("bh.day.endFor", { day: shortLabel, index: idx + 1 })}
                            size="small"
                            status={endError ? "error" : undefined}
                            value={range.end}
                            onChange={(e) => onUpdateRangeTime(wd, range.id, "end", e.target.value)}
                            style={{ maxWidth: 100 }}
                          />
                          <Button
                            aria-label={t("bh.day.removeFor", { day: shortLabel, index: idx + 1 })}
                            danger
                            size="small"
                            onClick={() => onRemoveRange(wd, range.id)}
                          >
                            ✕
                          </Button>
                        </>
                      ) : (
                        <Text>
                          {range.start}–{range.end}
                        </Text>
                      )}
                    </Flex>
                  );
                })}
                {editMode === "editing" && (
                  <Button size="small" onClick={() => onAddRange(wd)}>
                    {t("bh.day.addRange")}
                  </Button>
                )}
                {showDayErrors && dayErrors.length > 0 && (
                  <Text role="alert" type="danger">
                    {dayErrors.map((e) => t(`bh.validation.${e.code}`)).join("; ")}
                  </Text>
                )}
              </Flex>
            ) : (
              <Text type="secondary">{t("bh.day.closedHint")}</Text>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
