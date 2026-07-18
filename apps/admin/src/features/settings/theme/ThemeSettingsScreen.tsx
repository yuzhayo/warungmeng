import {
  DEFAULT_ADMIN_THEME_SETTINGS,
  adminThemeSettingsEqual,
  useAdminTheme,
  type AdminCustomThemePatch,
  type AdminThemeMode,
} from "@warungmeng/ui-admin";
import { Button, Col, Flex, Row, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemeModeControl } from "./ThemeModeControl";
import { ThemePreviewPlaceholder } from "./ThemePreviewPlaceholder";
import { ThemeTokenEditor } from "./ThemeTokenEditor";

export function ThemeSettingsScreen() {
  const { t } = useTranslation();
  const { draft, hasChanges, cancel, resetDraft, save, setMode, updateCustomTheme } =
    useAdminTheme();
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  function handleModeChange(mode: AdminThemeMode): void {
    setShowSavedFeedback(false);
    setMode(mode);
  }

  function handleCustomThemeChange(patch: AdminCustomThemePatch): void {
    setShowSavedFeedback(false);
    updateCustomTheme(patch);
  }

  function handleSave(): void {
    save();
    setShowSavedFeedback(true);
  }

  function handleCancel(): void {
    cancel();
    setShowSavedFeedback(false);
  }

  function handleReset(): void {
    setShowSavedFeedback(false);
    resetDraft();
  }

  return (
    <Row align="stretch" gutter={[24, 24]}>
      <Col xs={24} xl={14}>
        <Flex gap="large" vertical>
          <ThemeModeControl mode={draft.mode} onChange={handleModeChange} />
          <ThemeTokenEditor
            disabled={draft.mode === "default"}
            onChange={handleCustomThemeChange}
            settings={draft.custom}
          />
        </Flex>
      </Col>

      <Col xs={24} xl={10}>
        <Flex gap="large" style={{ height: "100%" }} vertical>
          <ThemePreviewPlaceholder />

          <Flex gap="small" vertical>
            {showSavedFeedback ? (
              <Typography.Text role="status" type="success">
                {t("theme.feedback.saved")}
              </Typography.Text>
            ) : null}
            <Flex gap="middle">
              <Button
                block
                disabled={adminThemeSettingsEqual(draft, DEFAULT_ADMIN_THEME_SETTINGS)}
                onClick={handleReset}
                style={{ flex: "1 1 0", minWidth: 0 }}
              >
                {t("theme.actions.reset")}
              </Button>
              <Button
                block
                disabled={!hasChanges}
                onClick={handleCancel}
                style={{ flex: "1 1 0", minWidth: 0 }}
              >
                {t("theme.actions.cancel")}
              </Button>
              <Button
                block
                disabled={!hasChanges}
                onClick={handleSave}
                style={{ flex: "1 1 0", minWidth: 0 }}
                type="primary"
              >
                {t("theme.actions.save")}
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
}
