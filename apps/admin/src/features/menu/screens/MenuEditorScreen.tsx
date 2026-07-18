import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { Alert, App, Button, Flex, Result, Spin } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  createDefaultMenuEditorValues,
  getSelectableVariantGroups,
  mapMenuToEditorValues,
  type MenuEditorInput,
  type MenuEditorValues,
} from "../application/menuEditorModel";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { MenuEditorForm } from "../components/MenuEditorForm";
import "./MenuEditorScreen.css";

export interface MenuEditorScreenProps {
  readonly mode: "create" | "edit";
  readonly repository?: MenuCatalogRepository;
}

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "not-found" }
  | {
      readonly status: "ready";
      readonly baseline: MenuItem | null;
      readonly categories: readonly MenuCategory[];
      readonly initialValues: MenuEditorValues;
      readonly sortOrder: number;
      readonly variantGroups: readonly MenuVariantGroup[];
    };

function createDraftIntervalId(): string {
  return `sales-interval-${crypto.randomUUID()}`;
}

export function MenuEditorScreen({
  mode,
  repository = menuCatalogRepository,
}: MenuEditorScreenProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { menuId } = useParams<{ menuId: string }>();
  const [reloadVersion, setReloadVersion] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const common = Promise.all([
      repository.listMenus(),
      repository.listCategories(),
      repository.listVariantGroups(),
    ]);
    const load =
      mode === "create"
        ? common.then(
            ([menus, categories, groups]) =>
              ({
                status: "ready",
                baseline: null,
                categories,
                initialValues: createDefaultMenuEditorValues(createDraftIntervalId()),
                sortOrder:
                  menus.reduce((highest, menu) => Math.max(highest, menu.sortOrder), -1) + 1,
                variantGroups: getSelectableVariantGroups(groups),
              }) satisfies LoadState,
          )
        : menuId
          ? Promise.all([repository.getMenuById(menuId), common]).then(
              ([menu, [, categories, groups]]) =>
                menu
                  ? ({
                      status: "ready",
                      baseline: menu,
                      categories,
                      initialValues: mapMenuToEditorValues(menu),
                      sortOrder: menu.sortOrder,
                      variantGroups: getSelectableVariantGroups(groups),
                    } satisfies LoadState)
                  : ({ status: "not-found" } satisfies LoadState),
            )
          : Promise.resolve({ status: "not-found" } satisfies LoadState);

    void load
      .then((state) => {
        if (!cancelled) setLoadState(state);
      })
      .catch(() => {
        if (!cancelled) setLoadState({ status: "error" });
      });

    return () => {
      cancelled = true;
    };
  }, [menuId, mode, reloadVersion, repository]);

  function returnToList(): void {
    navigate("/menu");
  }

  async function handleSubmit(input: MenuEditorInput): Promise<void> {
    try {
      if (mode === "create") {
        await repository.createMenu(input);
      } else {
        if (!menuId) throw new Error("Missing menu ID");
        const updated = await repository.updateMenu(menuId, input);
        if (!updated) throw new Error(`Menu ${menuId} was not found`);
      }

      void message.success(
        t(mode === "create" ? "menu.editor.feedback.created" : "menu.editor.feedback.saved"),
      );
      returnToList();
    } catch {
      void message.error(t("menu.editor.feedback.saveFailed"));
    }
  }

  async function handleDelete(): Promise<void> {
    if (mode !== "edit" || !menuId) return;

    setDeleting(true);
    try {
      const deleted = await repository.deleteMenu(menuId);
      if (!deleted) {
        throw new Error(`Menu ${menuId} was not found`);
      }

      void message.success(t("menu.editor.feedback.deleted"));
      returnToList();
    } catch {
      setDeleting(false);
      void message.error(t("menu.editor.feedback.deleteFailed"));
    }
  }

  if (loadState.status === "loading") {
    return (
      <Flex align="center" className="menu-editor__loading" justify="center">
        <Spin size="large" />
      </Flex>
    );
  }

  if (loadState.status === "error") {
    return (
      <Alert
        action={
          <Button
            onClick={() => {
              setLoadState({ status: "loading" });
              setReloadVersion((value) => value + 1);
            }}
            size="small"
          >
            {t("menu.actions.retry")}
          </Button>
        }
        showIcon
        title={t("menu.editor.error.load")}
        type="error"
      />
    );
  }

  if (loadState.status === "not-found") {
    return (
      <Result
        extra={
          <Button onClick={returnToList} type="primary">
            {t("menu.editor.actions.backToList")}
          </Button>
        }
        status="404"
        subTitle={t("menu.editor.notFound.description")}
        title={t("menu.editor.notFound.title")}
      />
    );
  }

  return (
    <div className="menu-editor">
      <MenuEditorForm
        baseline={loadState.baseline}
        categories={loadState.categories}
        deleting={deleting}
        initialValues={loadState.initialValues}
        key={`${mode}:${menuId ?? "new"}`}
        mode={mode}
        onCancel={returnToList}
        onDelete={mode === "edit" ? handleDelete : undefined}
        onSubmit={handleSubmit}
        sortOrder={loadState.sortOrder}
        variantGroups={loadState.variantGroups}
      />
    </div>
  );
}
