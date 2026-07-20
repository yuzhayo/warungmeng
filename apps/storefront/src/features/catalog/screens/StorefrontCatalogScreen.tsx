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
import type { StorefrontCatalogRepository } from "../application/storefrontCatalogRepository";
import { CatalogToolbar } from "../components/CatalogToolbar";
import { CategoryMenuList } from "../components/CategoryMenuList";
import { FeaturedMenuGrid } from "../components/FeaturedMenuGrid";
import { MerchantHero } from "../components/MerchantHero";
import styles from "../StorefrontCatalog.module.css";

const LOADING_CARD_KEYS = ["first", "second", "third", "fourth"] as const;

interface StorefrontCatalogScreenProps {
  repository?: StorefrontCatalogRepository;
}

export function StorefrontCatalogScreen({ repository }: StorefrontCatalogScreenProps) {
  const { t } = useTranslation();
  const state = useStorefrontCatalog(repository);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("featured");

  // Compute view model and filtered menus
  const { viewModel, filteredMenus } = useMemo(() => {
    if (state.status !== "ready") {
      return { viewModel: null, filteredMenus: [] };
    }

    const viewModel = buildCatalogViewModel(state.menus, state.categories);

    // If there's a search query, filter across all menus
    if (searchQuery.trim()) {
      return {
        viewModel,
        filteredMenus: searchCatalogMenus(viewModel, searchQuery),
      };
    }

    // Otherwise, show featured or category-specific menus
    if (activeCategory === "featured") {
      return {
        viewModel,
        filteredMenus: getFeaturedMenus(viewModel),
      };
    }

    return {
      viewModel,
      filteredMenus: filterMenusByCategory(viewModel, activeCategory),
    };
  }, [state, searchQuery, activeCategory]);

  // Handle loading state
  if (state.status === "loading") {
    return (
      <div
        className={styles.loadingState}
        role="status"
        aria-label={t("storefront.loading")}
        aria-live="polite"
      >
        <div className={styles.loadingGrid}>
          {LOADING_CARD_KEYS.map((key) => (
            <div className={styles.loadingCard} key={key} aria-hidden="true">
              <Skeleton.Image active />
              <Skeleton active title paragraph={{ rows: 2 }} />
            </div>
          ))}
        </div>
        <span className={styles.visuallyHidden}>{t("storefront.loading")}</span>
      </div>
    );
  }

  // Handle error state
  if (state.status === "error") {
    return (
      <Alert
        title={t("storefront.error.load")}
        description={
          <Button type="primary" onClick={state.retry}>
            {t("storefront.error.retry")}
          </Button>
        }
        type="error"
        showIcon
      />
    );
  }

  // This should never happen, but just in case
  if (!viewModel) {
    return null;
  }

  const contentLabel = searchQuery
    ? t("storefront.search.results", { query: searchQuery })
    : activeCategory === "featured"
      ? t("storefront.featured.tab")
      : viewModel.categories.find((category) => category.id === activeCategory)?.name;

  return (
    <>
      <MerchantHero />
      <CatalogToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
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
        ) : activeCategory === "featured" && !searchQuery ? (
          <FeaturedMenuGrid menus={filteredMenus} />
        ) : (
          <CategoryMenuList menus={filteredMenus} />
        )}
      </section>
    </>
  );
}
