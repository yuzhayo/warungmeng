import { Alert, Button, Empty, Flex, Input, Modal, Switch, Tag, Tabs, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { BusinessHoursState, InternalTab } from "../application/useBusinessHours";
import type { OutletSchedule, ValidationError } from "../application/businessHoursModel";
import { ScheduleEditor } from "./ScheduleEditor";
import "./OutletDetail.css";

interface OutletDetailProps {
  readonly state: BusinessHoursState;
  readonly isDirty: boolean;
  readonly savedOutlet: OutletSchedule | null;
  readonly startEdit: () => void;
  readonly cancelEdit: () => void;
  readonly confirmDiscard: () => void;
  readonly confirmKeepEditing: () => void;
  readonly goBack: () => void;
  readonly switchTab: (tab: InternalTab) => void;
  readonly save: () => void;
  readonly updateDayOpen: (weekday: string, open: boolean) => void;
  readonly updateRangeTime: (
    weekday: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ) => void;
  readonly addRange: (weekday: string) => void;
  readonly removeRange: (weekday: string, rangeId: string) => void;
  readonly addSpecial: () => void;
  readonly removeSpecial: (specialId: string) => void;
  readonly updateSpecialField: (
    specialId: string,
    field: "name" | "startDate" | "endDate" | "enabled",
    value: string | boolean,
  ) => void;
  readonly updateSpecialDayOpen: (specialId: string, weekday: string, open: boolean) => void;
  readonly updateSpecialRangeTime: (
    specialId: string,
    weekday: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ) => void;
  readonly addSpecialRange: (specialId: string, weekday: string) => void;
  readonly removeSpecialRange: (specialId: string, weekday: string, rangeId: string) => void;
  readonly getDayErrors: (weekday: string) => ValidationError[];
  readonly getSpecialErrors: (specialId: string) => ValidationError[];
}

export function OutletDetail(props: OutletDetailProps) {
  const {
    state,
    savedOutlet,
    startEdit,
    cancelEdit,
    confirmDiscard,
    confirmKeepEditing,
    goBack,
    switchTab,
    save,
    updateDayOpen,
    updateRangeTime,
    addRange,
    removeRange,
    addSpecial,
    removeSpecial,
    updateSpecialField,
    updateSpecialDayOpen,
    updateSpecialRangeTime,
    addSpecialRange,
    removeSpecialRange,
    getDayErrors,
    getSpecialErrors,
  } = props;

  const { t } = useTranslation();
  const {
    selectedOutletId,
    editMode,
    draft,
    internalTab,
    confirmOpen,
    saveAttempted,
    showSavedFeedback,
    touched,
  } = state;

  if (!selectedOutletId || !savedOutlet) return null;

  const outlet = editMode === "editing" && draft ? draft : savedOutlet;

  function isOutletOpen(): boolean {
    return outlet.regular.some((d) => d.open);
  }

  const tabItems = [
    {
      key: "regular",
      label: t("bh.detail.tabs.regular"),
      children: (
        <ScheduleEditor
          days={outlet.regular}
          editMode={editMode}
          saveAttempted={saveAttempted}
          touched={touched}
          getDayErrors={getDayErrors}
          onUpdateDayOpen={updateDayOpen}
          onUpdateRangeTime={updateRangeTime}
          onAddRange={addRange}
          onRemoveRange={removeRange}
        />
      ),
    },
    {
      key: "special",
      label: t("bh.detail.tabs.special"),
      children: (
        <SpecialScheduleSection
          editMode={editMode}
          draft={draft}
          saveAttempted={saveAttempted}
          touched={touched}
          getSpecialErrors={getSpecialErrors}
          onAdd={addSpecial}
          onRemove={removeSpecial}
          onUpdateField={updateSpecialField}
          onUpdateDayOpen={updateSpecialDayOpen}
          onUpdateRangeTime={updateSpecialRangeTime}
          onAddRange={addSpecialRange}
          onRemoveRange={removeSpecialRange}
        />
      ),
    },
  ];

  return (
    <Flex className="outlet-detail" gap="middle" vertical>
      <Flex align="center" gap="middle">
        <Button aria-label={t("bh.detail.back")} onClick={goBack}>
          {t("bh.detail.back")}
        </Button>
        <Typography.Title level={4}>{outlet.name}</Typography.Title>
        <Tag color={isOutletOpen() ? "green" : "red"}>
          {t("bh.detail.status")}:{" "}
          {isOutletOpen() ? t("bh.outlets.statusOpen") : t("bh.outlets.statusClosed")}
        </Tag>
      </Flex>

      {showSavedFeedback && (
        <Alert role="status" type="success" title={t("bh.detail.feedback.saved")} />
      )}

      <Flex align="center" gap="small">
        {editMode === "readonly" && (
          <Button type="primary" onClick={startEdit}>
            {t("bh.detail.edit")}
          </Button>
        )}
        {editMode === "editing" && (
          <>
            <Button onClick={cancelEdit}>{t("bh.detail.cancel")}</Button>
            <Button type="primary" onClick={save}>
              {t("bh.detail.save")}
            </Button>
          </>
        )}
      </Flex>

      <Tabs
        activeKey={internalTab}
        aria-label={t("bh.detail.tabs.label")}
        items={tabItems}
        onChange={(key) => switchTab(key as InternalTab)}
      />

      <Modal
        destroyOnHidden
        open={confirmOpen}
        title={t("bh.detail.confirm.title")}
        onCancel={confirmKeepEditing}
        onOk={confirmDiscard}
        okText={t("bh.detail.confirm.discard")}
        cancelText={t("bh.detail.confirm.keepEditing")}
      >
        <Typography.Text>{t("bh.detail.confirm.description")}</Typography.Text>
      </Modal>
    </Flex>
  );
}

/* — Special Schedule Section — */

interface SpecialSectionProps {
  readonly editMode: "readonly" | "editing";
  readonly draft: BusinessHoursState["draft"];
  readonly saveAttempted: boolean;
  readonly touched: BusinessHoursState["touched"];
  readonly getSpecialErrors: (specialId: string) => ValidationError[];
  readonly onAdd: () => void;
  readonly onRemove: (specialId: string) => void;
  readonly onUpdateField: (
    specialId: string,
    field: "name" | "startDate" | "endDate" | "enabled",
    value: string | boolean,
  ) => void;
  readonly onUpdateDayOpen: (specialId: string, weekday: string, open: boolean) => void;
  readonly onUpdateRangeTime: (
    specialId: string,
    weekday: string,
    rangeId: string,
    field: "start" | "end",
    value: string,
  ) => void;
  readonly onAddRange: (specialId: string, weekday: string) => void;
  readonly onRemoveRange: (specialId: string, weekday: string, rangeId: string) => void;
}

function SpecialScheduleSection({
  editMode,
  draft,
  saveAttempted,
  touched,
  getSpecialErrors,
  onAdd,
  onRemove,
  onUpdateField,
  onUpdateDayOpen,
  onUpdateRangeTime,
  onAddRange,
  onRemoveRange,
}: SpecialSectionProps) {
  const { t } = useTranslation();
  const specials = draft?.specials ?? [];

  if (specials.length === 0) {
    return (
      <Flex gap="middle" vertical>
        <Empty description={t("bh.special.empty")} />
        <Typography.Text type="secondary">{t("bh.special.emptyDescription")}</Typography.Text>
        {editMode === "editing" && (
          <Button type="primary" onClick={onAdd}>
            {t("bh.special.add")}
          </Button>
        )}
      </Flex>
    );
  }

  return (
    <Flex gap="large" vertical>
      {specials.map((special) => {
        const errors = saveAttempted ? getSpecialErrors(special.id) : [];
        return (
          <Flex className="special-schedule-card" gap="middle" key={special.id} vertical>
            <Flex align="center" gap="small">
              {editMode === "editing" ? (
                <>
                  <Input
                    aria-label={t("bh.special.name")}
                    placeholder={t("bh.special.namePlaceholder")}
                    size="small"
                    status={errors.some((e) => e.code === "name") ? "error" : undefined}
                    style={{ maxWidth: 200 }}
                    value={special.name}
                    onChange={(e) => onUpdateField(special.id, "name", e.target.value)}
                  />
                  <Switch
                    aria-label={t("bh.special.enabledSwitch", { name: special.name })}
                    checked={special.enabled}
                    onChange={(v) => onUpdateField(special.id, "enabled", v)}
                  />
                  <Typography.Text>{t("bh.special.enabled")}</Typography.Text>
                  <Button
                    aria-label={t("bh.special.deleteFor", { name: special.name })}
                    danger
                    size="small"
                    onClick={() => onRemove(special.id)}
                  >
                    {t("bh.special.delete")}
                  </Button>
                </>
              ) : (
                <>
                  <Typography.Text strong>{special.name}</Typography.Text>
                  <Tag color={special.enabled ? "green" : undefined}>
                    {special.enabled ? t("bh.special.enabled") : ""}
                  </Tag>
                </>
              )}
            </Flex>
            <Flex align="center" gap="small">
              {editMode === "editing" ? (
                <>
                  <Typography.Text>{t("bh.special.startDate")}</Typography.Text>
                  <Input
                    aria-label={t("bh.special.startDateFor", { name: special.name })}
                    placeholder="YYYY-MM-DD"
                    size="small"
                    status={
                      errors.some((e) => e.path === "special.startDate") ? "error" : undefined
                    }
                    style={{ maxWidth: 140 }}
                    value={special.startDate}
                    onChange={(e) => onUpdateField(special.id, "startDate", e.target.value)}
                  />
                  <Typography.Text>{t("bh.special.endDate")}</Typography.Text>
                  <Input
                    aria-label={t("bh.special.endDateFor", { name: special.name })}
                    placeholder="YYYY-MM-DD"
                    size="small"
                    status={errors.some((e) => e.path === "special.endDate") ? "error" : undefined}
                    style={{ maxWidth: 140 }}
                    value={special.endDate}
                    onChange={(e) => onUpdateField(special.id, "endDate", e.target.value)}
                  />
                </>
              ) : (
                <Typography.Text>
                  {special.startDate}–{special.endDate}
                </Typography.Text>
              )}
            </Flex>
            {saveAttempted && errors.length > 0 && (
              <Typography.Text role="alert" type="danger">
                {errors.map((e) => t(`bh.special.validation.${e.code}`)).join("; ")}
              </Typography.Text>
            )}
            <ScheduleEditor
              days={special.days}
              editMode={editMode}
              saveAttempted={saveAttempted}
              touched={touched}
              getDayErrors={(wd) => {
                const day = special.days.find((d) => d.weekday === wd);
                if (!day) return [];
                return getSpecialErrors(special.id).filter(
                  (e) => e.path.startsWith("range.") || e.path === `day.${wd}`,
                );
              }}
              onUpdateDayOpen={(wd, open) => onUpdateDayOpen(special.id, wd, open)}
              onUpdateRangeTime={(wd, rangeId, field, value) =>
                onUpdateRangeTime(special.id, wd, rangeId, field, value)
              }
              onAddRange={(wd) => onAddRange(special.id, wd)}
              onRemoveRange={(wd, rangeId) => onRemoveRange(special.id, wd, rangeId)}
            />
          </Flex>
        );
      })}
      {editMode === "editing" && specials.length < 5 && (
        <Button onClick={onAdd}>{t("bh.special.add")}</Button>
      )}
    </Flex>
  );
}
