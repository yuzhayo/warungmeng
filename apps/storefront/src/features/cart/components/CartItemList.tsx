import type { MenuItem } from "@warungmeng/domain";
import type { CartLineValidation } from "../application/cartValidation";
import type { StorefrontCartItem } from "../application/storefrontCartModel";
import styles from "../Cart.module.css";
import { CartItemCard } from "./CartItemCard";

interface CartItemListProps {
  lines: readonly CartLineValidation[];
  onQuantityChange: (itemId: string, quantity: number) => void;
  onEdit: (item: StorefrontCartItem, menu: MenuItem) => void;
  onRemoveRequest: (item: StorefrontCartItem) => void;
}

export function CartItemList({
  lines,
  onQuantityChange,
  onEdit,
  onRemoveRequest,
}: CartItemListProps) {
  return (
    <ul className={styles.itemList}>
      {lines.map((line) => (
        <li key={line.item.id}>
          <CartItemCard
            line={line}
            onQuantityChange={onQuantityChange}
            onEdit={onEdit}
            onRemoveRequest={onRemoveRequest}
          />
        </li>
      ))}
    </ul>
  );
}
