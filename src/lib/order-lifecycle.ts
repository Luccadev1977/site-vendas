export type OrderFolder = 'active' | 'archived' | 'trash';
export type OrderDates = { archived_at?: string | null; deleted_at?: string | null };
export const pendingOrderMigrationMessage =
  'Arquivamento, lixeira e exclusão aguardam autorização e aplicação da migration. Nenhum pedido foi alterado.';
export function orderLifecycleReady(orders: readonly OrderDates[]) {
  // Read the existing response shape; never probe missing columns or call a missing RPC.
  // An empty collection has no mutation controls to enable.
  return orders.every((order) =>
    ['archived_at', 'deleted_at'].every(
      (key) =>
        Object.hasOwn(order, key) &&
        (order[key as keyof OrderDates] === null ||
          typeof order[key as keyof OrderDates] === 'string'),
    ),
  );
}
export function orderFolder(order: OrderDates): OrderFolder {
  return order.deleted_at ? 'trash' : order.archived_at ? 'archived' : 'active';
}
export function isOrderAction(action: string) {
  return ['archive_order', 'trash_order', 'restore_order', 'purge_order'].includes(action);
}
