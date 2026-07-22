import { InMemoryOrderRepository } from "@warungmeng/data";
import type { OrderRepository } from "@warungmeng/data";

// Storefront orders are intentionally process-local until backend synchronization is approved.
export const storefrontOrderRepository: OrderRepository = new InMemoryOrderRepository();
