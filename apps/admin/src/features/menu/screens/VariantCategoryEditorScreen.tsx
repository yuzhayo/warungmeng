import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuVariantGroup } from "@warungmeng/domain";
import { Alert, App, Button, Flex, Result, Spin } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  createDefaultVariantCategoryEditorValues,
  mapVariantGroupToEditorValues,
  type VariantCategoryEditorInput,
  type VariantCategoryEditorValues,
} from "../application/variantCategoryEditorModel";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { VariantCategoryEditorForm } from "../components/VariantCategoryEditorForm";
import "./VariantCategoryEditorScreen.css";

export interface VariantCategoryEditorScreenProps {
  readonly mode: "create" | "edit";
  readonly repository?: MenuCatalogRepository;
}

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "not-found" }
  | {
      readonly status: "ready";
      readonly baseline: MenuVariantGroup | null;
      readonly initialValues: VariantCategoryEditorValues;
      readonly sortOrder: number;
    };

function createDraftOptionId(): string {
  return `variant-option-${crypto.randomUUID()}`;
}

export function VariantCategoryEditorScreen({
  mode,
  repository = menuCatalogRepository,
}: VariantCategoryEditorScreenProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { variantGroupId } = useParams<{ variantGroupId: string }>();
  const [reloadVersion, setReloadVersion] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const load =
      mode === "create"
        ? repository.listVariantGroups().then((groups) => {
            const sortOrder =
              groups.reduce((highest, group) => Math.max(highest, group.sortOrder), -1) + 1;
            return {
              status: "ready",
              baseline: null,
              initialValues: createDefaultVariantCategoryEditorValues(createDraftOptionId()),
              sortOrder,
            } satisfies LoadState;
          })
        : variantGroupId
          ? repository.getVariantGroupById(variantGroupId).then((group) =>
              group
                ? ({
                    status: "ready",
                    baseline: group,
                    initialValues: mapVariantGroupToEditorValues(group),
                    sortOrder: group.sortOrder,
                  } satisfies LoadState)
                : ({ status: "not-found" } satisfies LoadState),
            )
          : Promise.resolve({ status: "not-found" } satisfies LoadState);

    void load
      .then((nextState) => {
        if (!cancelled) setLoadState(nextState);
      })
      .catch(() => {
        if (!cancelled) setLoadState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [mode, reloadVersion, repository, variantGroupId]);

  function returnToList(): void {
    navigate("/menu/variants");
  }

  function retryLoad(): void {
    setLoadState({ status: "loading" });
    setReloadVersion((current) => current + 1);
  }

  async function handleSubmit(input: VariantCategoryEditorInput): Promise<void> {
    try {
      if (mode === "create") {
        await repository.createVariantGroup(input);
      } else {
        if (!variantGroupId) throw new Error("Missing variant group ID");
        const updated = await repository.updateVariantGroup(variantGroupId, input);
        if (!updated) throw new Error(`Variant group ${variantGroupId} was not found`);
      }

      void message.success(
        t(
          mode === "create" ? "variants.editor.feedback.created" : "variants.editor.feedback.saved",
        ),
      );
      returnToList();
    } catch {
      void message.error(t("variants.editor.feedback.saveFailed"));
    }
  }

  if (loadState.status === "loading") {
    return (
      <Flex align="center" className="variant-category-editor__loading" justify="center">
        <Spin size="large" />
      </Flex>
    );
  }

  if (loadState.status === "error") {
    return (
      <Alert
        action={
          <Button onClick={retryLoad} size="small">
            {t("menu.actions.retry")}
          </Button>
        }
        showIcon
        title={t("variants.editor.error.load")}
        type="error"
      />
    );
  }

  if (loadState.status === "not-found") {
    return (
      <Result
        extra={
          <Button onClick={returnToList} type="primary">
            {t("variants.editor.actions.backToList")}
          </Button>
        }
        status="404"
        subTitle={t("variants.editor.notFound.description")}
        title={t("variants.editor.notFound.title")}
      />
    );
  }

  return (
    <div className="variant-category-editor">
      <VariantCategoryEditorForm
        baseline={loadState.baseline}
        initialValues={loadState.initialValues}
        key={`${mode}:${variantGroupId ?? "new"}`}
        mode={mode}
        onCancel={returnToList}
        onSubmit={handleSubmit}
        sortOrder={loadState.sortOrder}
      />
    </div>
  );
}
