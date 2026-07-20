import { createWarungMengFinanceRepository } from "@warungmeng/data";
import { orderRepository } from "../../orders/application/orderRepository";

export const ACTIVE_FINANCE_OUTLET_ID = "wm-1";
export const financeRepository = createWarungMengFinanceRepository();
export const financeOrderRepository = orderRepository;
