import { fireEvent, render, screen } from "@testing-library/react";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { describe, expect, it, vi } from "vitest";
import { CatalogSplitTableLayout } from "./CatalogSplitTableLayout";

describe("CatalogSplitTableLayout", () => {
  it("keeps category editing separate from category selection", () => {
    const onCategoryChange = vi.fn();
    const onEditCategory = vi.fn();

    render(
      <AdminUiProvider storage={null}>
        <CatalogSplitTableLayout
          categories={[{ count: 2, id: "portion", name: "PORSI" }]}
          categoryAriaLabel="Variant categories"
          categoryTitle="Variant Categories"
          collapsed={false}
          collapseLabel="Collapse"
          editCategoryLabel={(category) => `Edit ${category.name}`}
          expandLabel="Expand"
          onCategoryChange={onCategoryChange}
          onCollapsedChange={vi.fn()}
          onEditCategory={onEditCategory}
          selectedCategoryId={null}
        >
          <div>Table</div>
        </CatalogSplitTableLayout>
      </AdminUiProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit PORSI" }));

    expect(onEditCategory).toHaveBeenCalledWith({
      count: 2,
      id: "portion",
      name: "PORSI",
    });
    expect(onCategoryChange).not.toHaveBeenCalled();
  });
});
