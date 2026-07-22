import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { Alert, Button, Empty, Skeleton } from "antd";
import {
  buildCatalogViewModel,
  filterMenusByCategory,
  getFeaturedMenus,
  searchCatalogMenus,
} from "../application/storefrontCatalogModel";
import { useStorefrontCatalog } from "../application/useStorefrontCatalog";
import type {
  StorefrontCatalogRepository,
  StorefrontMenuDetailRepository,
} from "../application/storefrontCatalogRepository";
import { CatalogToolbar } from "../components/CatalogToolbar";
import { CategoryMenuList } from "../components/CategoryMenuList";
import { FeaturedMenuGrid } from "../components/FeaturedMenuGrid";
import { MenuDetailDrawer } from "../components/MenuDetailDrawer";
import { MerchantHero } from "../components/MerchantHero";
import styles from "../StorefrontCatalog.module.css";

const LOADING_CARD_KEYS = ["first", "second", "third", "fourth"] as const;

interface StorefrontCatalogScreenProps {
  repository?: StorefrontCatalogRepository;
  detailRepository?: StorefrontMenuDetailRepository;
}

export function StorefrontCatalogScreen({
  repository,
  detailRepository,
}: StorefrontCatalogScreenProps) {
  const { t } = useTranslation();
  const state = useStorefrontCatalog(repository);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("featured");
  const [drawerSlug, setDrawerSlug] = useState<string | null>(null);

  // Compute view model and filtered menus
  const { viewModel, filteredMenus, effectiveCategory } = useMemo(() => {
    if (state.status !== "ready") {
      return { viewModel: null, filteredMenus: [], effectiveCategory: "featured" };
    }

    const viewModel = buildCatalogViewModel(state.menus, state.categories);

    // A previously selected category can disappear after fresh data; fall back to featured
    // instead of leaving a dangling tab key and an unlabeled content section.
    const effectiveCategory =
      activeCategory === "featured" ||
      viewModel.categories.some((category) => category.id === activeCategory)
        ? activeCategory
        : "featured";

    // If there's a search query, filter across all menus
    if (searchQuery.trim()) {
      return {
        viewModel,
        filteredMenus: searchCatalogMenus(viewModel, searchQuery),
        effectiveCategory,
      };
    }

    // Otherwise, show featured or category-specific menus
    if (effectiveCategory === "featured") {
      return {
        viewModel,
        filteredMenus: getFeaturedMenus(viewModel),
        effectiveCategory,
      };
    }

    return {
      viewModel,
      filteredMenus: filterMenusByCategory(viewModel, effectiveCategory),
      effectiveCategory,
    };
  }, [state, searchQuery, activeCategory]);

  // Handle loading state
  if (state.status === "loading") {
    return (
      <div className={styles.loadingState} role="status" aria-label={t("storefront.loading")}>
        <div className={styles.loadingGrid}>
          {LOADING_CARD_KEYS.map((key) => (
            <div className={styles.loadingCard} key={key} aria-hidden="true">
              <Skeleton.Image active />
              <Skeleton active title paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (state.status === "error") {
    return (
      <Alert
        title={t("storefront.error.load")}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={state.retry}>
            {t("storefront.error.retry")}
          </Button>
        }
      />
    );
  }

  // This should never happen, but just in case
  if (!viewModel) {
    return null;
  }

  const contentLabel = searchQuery
    ? t("storefront.search.results", { query: searchQuery })
    : effectiveCategory === "featured"
      ? t("storefront.featured.tab")
      : viewModel.categories.find((category) => category.id === effectiveCategory)?.name;

  return (
    <>
      <MerchantHero />
      <CatalogToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={effectiveCategory}
        onCategoryChange={setActiveCategory}
        categories={viewModel.categories}
      />

      <section aria-label={contentLabel}>
        {filteredMenus.length === 0 ? (
          <Empty
            description={
              searchQuery
                ? t("storefront.empty.search", { query: searchQuery })
                : t("storefront.empty.catalog")
            }
          />
        ) : effectiveCategory === "featured" && !searchQuery ? (
          <FeaturedMenuGrid
            menus={filteredMenus}
            onAddAction={(menu) => setDrawerSlug(menu.slug)}
          />
        ) : (
          <CategoryMenuList
            menus={filteredMenus}
            onAddAction={(menu) => setDrawerSlug(menu.slug)}
          />
        )}
      </section>

      <MenuDetailDrawer
        menuSlug={drawerSlug}
        onClose={() => setDrawerSlug(null)}
        repository={detailRepository}
      />
    </>
  );
}
