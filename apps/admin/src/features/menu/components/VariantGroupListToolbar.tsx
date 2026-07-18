import { PlusOutlined } from "@ant-design/icons";
import { Button, Flex, Input, Segmented } from "antd";
import { useTranslation } from "react-i18next";
import type { VariantGroupAvailabilityFilter } from "../application/variantGroupListModel";

export interface VariantGroupListToolbarProps {
  readonly allCount: number;
  readonly availability: VariantGroupAvailabilityFilter;
  readonly search: string;
  readonly unavailableCount: number;
  readonly onAvailabilityChange: (availability: VariantGroupAvailabilityFilter) => void;
  readonly onCreate: () => void;
  readonly onSearchChange: (search: string) => void;
}

const { Search } = Input;

export function VariantGroupListToolbar({
  allCount,
  availability,
  search,
  unavailableCount,
  onAvailabilityChange,
  onCreate,
  onSearchChange,
}: VariantGroupListToolbarProps) {
  const { t } = useTranslation();

  return (
    <Flex align="center" gap="middle" justify="space-between" wrap>
      <Flex align="center" gap="small" style={{ flex: "1 1 40rem", minWidth: 0 }} wrap>
        <Search
          allowClear
          aria-label={t("variants.search.placeholder")}
          enterButton={t("variants.search.action")}
          onChange={(event) => onSearchChange(event.target.value)}
          onSearch={onSearchChange}
          placeholder={t("variants.search.placeholder")}
          style={{ width: "clamp(17rem, 34vw, 28rem)" }}
          value={search}
        />
        <Segmented<VariantGroupAvailabilityFilter>
          aria-label={t("variants.filters.label")}
          onChange={onAvailabilityChange}
          options={[
            { label: `${t("menu.filter.all")} (${allCount})`, value: "all" },
            {
              label: `${t("menu.filter.unavailable")} (${unavailableCount})`,
              value: "unavailable",
            },
          ]}
          value={availability}
        />
      </Flex>

      <Button icon={<PlusOutlined />} onClick={onCreate} type="primary">
        {t("variants.actions.create")}
      </Button>
    </Flex>
  );
}
