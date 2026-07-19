import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { isMenuSellable, type MenuCategory, type MenuItem } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Button, Card, Empty, Image, Input, Select, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface PosCatalogProps {
  readonly menus: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
  readonly search: string;
  readonly categoryId: string | null;
  readonly disabled: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string | null) => void;
  readonly onSelectMenu: (menu: MenuItem) => void;
}

export function PosCatalog({
  menus,
  categories,
  search,
  categoryId,
  disabled,
  onSearchChange,
  onCategoryChange,
  onSelectMenu,
}: PosCatalogProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();

  return (
    <Card className="pos-catalog" title={t("pos.catalog.title")}>
      <div className="pos-catalog__toolbar">
        <Input
          allowClear
          aria-label={t("pos.catalog.search")}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("pos.catalog.searchPlaceholder")}
          prefix={<SearchOutlined aria-hidden />}
          value={search}
        />
        <Select
          allowClear
          aria-label={t("pos.catalog.category")}
          onChange={(value) => onCategoryChange(value ?? null)}
          options={categories.map((category) => ({ label: category.name, value: category.id }))}
          placeholder={t("pos.catalog.allCategories")}
          value={categoryId ?? undefined}
        />
      </div>

      {menus.length === 0 ? (
        <Empty description={t("pos.catalog.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="pos-catalog__grid">
          {menus.map((menu) => {
            const sellable = isMenuSellable(menu);
            return (
              <Card
                className="pos-menu-card"
                cover={
                  menu.image ? (
                    <Image alt={menu.image.alt} preview={false} src={menu.image.url} />
                  ) : (
                    <div aria-hidden className="pos-menu-card__placeholder">
                      WM
                    </div>
                  )
                }
                key={menu.id}
                size="small"
              >
                <Typography.Text ellipsis strong title={menu.name}>
                  {menu.name}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {formatRupiah(menu.price.amount, { regionalFormat })}
                </Typography.Text>
                {!sellable ? <Tag color="default">{t("pos.catalog.unavailable")}</Tag> : null}
                <Button
                  aria-label={
                    menu.variantGroupIds.length > 0
                      ? t("pos.catalog.configure", { name: menu.name })
                      : t("pos.catalog.add", { name: menu.name })
                  }
                  block
                  disabled={disabled || !sellable}
                  icon={<PlusOutlined aria-hidden />}
                  onClick={() => onSelectMenu(menu)}
                  type="primary"
                >
                  {menu.variantGroupIds.length > 0
                    ? t("pos.variant.title", { name: menu.name })
                    : t("pos.catalog.addShort")}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}
