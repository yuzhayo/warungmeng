import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { Weekday } from "@warungmeng/domain";
import { Button, Checkbox, Flex, Form, Input, Radio, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";
import {
  MENU_EDITOR_MAX_INTERVALS,
  MENU_EDITOR_WEEKDAYS,
  type MenuEditorSalesMode,
  type MenuEditorValues,
} from "../application/menuEditorModel";

export interface MenuEditorSalesScheduleFieldsProps {
  readonly allDay: boolean;
  readonly salesMode: MenuEditorSalesMode;
}

function createIntervalId(): string {
  return `sales-interval-${crypto.randomUUID()}`;
}

export function MenuEditorSalesScheduleFields({
  allDay,
  salesMode,
}: MenuEditorSalesScheduleFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item label={t("menu.editor.schedule.mode")} name="salesMode">
        <Radio.Group
          options={[
            { label: t("menu.schedule.always"), value: "always" },
            { label: t("menu.schedule.scheduled"), value: "scheduled" },
          ]}
        />
      </Form.Item>

      {salesMode === "scheduled" ? (
        <>
          <Form.Item
            label={t("menu.editor.schedule.days")}
            name="activeDays"
            rules={[
              {
                validator: (_, days: readonly Weekday[]) =>
                  days?.length
                    ? Promise.resolve()
                    : Promise.reject(new Error(t("menu.editor.validation.days"))),
              },
            ]}
          >
            <Checkbox.Group
              options={MENU_EDITOR_WEEKDAYS.map((day) => ({
                label: t(`menu.editor.weekdays.${day}`),
                value: day,
              }))}
            />
          </Form.Item>

          <Form.Item label={t("menu.editor.schedule.allDay")}>
            <Flex align="center" gap="small">
              <Form.Item<MenuEditorValues> name="allDay" noStyle valuePropName="checked">
                <Switch aria-label={t("menu.editor.schedule.allDay")} />
              </Form.Item>
              <Typography.Text>{t("menu.editor.schedule.allDayHelp")}</Typography.Text>
            </Flex>
          </Form.Item>

          {!allDay ? (
            <Form.List
              name="intervals"
              rules={[
                {
                  validator: (_, intervals) =>
                    intervals?.length
                      ? Promise.resolve()
                      : Promise.reject(new Error(t("menu.editor.validation.intervals"))),
                },
              ]}
            >
              {(fields, { add, remove }, { errors }) => (
                <Flex gap="small" vertical>
                  {fields.map((field, index) => (
                    <Flex align="start" gap="small" key={field.key} wrap>
                      <Form.Item name={[field.name, "id"]} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item
                        label={index === 0 ? t("menu.editor.schedule.start") : undefined}
                        name={[field.name, "start"]}
                        rules={[{ required: true, message: t("menu.editor.validation.time") }]}
                      >
                        <Input
                          aria-label={t("menu.editor.schedule.startFor", {
                            index: index + 1,
                          })}
                          type="time"
                        />
                      </Form.Item>
                      <Form.Item
                        label={index === 0 ? t("menu.editor.schedule.end") : undefined}
                        name={[field.name, "end"]}
                        rules={[{ required: true, message: t("menu.editor.validation.time") }]}
                      >
                        <Input
                          aria-label={t("menu.editor.schedule.endFor", {
                            index: index + 1,
                          })}
                          type="time"
                        />
                      </Form.Item>
                      <Button
                        aria-label={t("menu.editor.schedule.removeFor", {
                          index: index + 1,
                        })}
                        danger
                        disabled={fields.length === 1}
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                        style={{ marginTop: index === 0 ? 30 : 0 }}
                        type="text"
                      />
                    </Flex>
                  ))}
                  <Form.ErrorList errors={errors} />
                  <Button
                    disabled={fields.length >= MENU_EDITOR_MAX_INTERVALS}
                    icon={<PlusOutlined />}
                    onClick={() => add({ id: createIntervalId(), start: "09:00", end: "21:00" })}
                  >
                    {t("menu.editor.schedule.addInterval")}
                  </Button>
                </Flex>
              )}
            </Form.List>
          ) : null}
        </>
      ) : null}
    </>
  );
}
