import { describe, it, expect } from 'vitest';
import { orderFolder, orderLifecycleReady } from '../src/lib/order-lifecycle';
import { commandSchema } from '../src/lib/validation';
describe('Order folders and command boundary', () => {
  it('keeps trash exclusive and supports pre-migration records', () => {
    expect(orderFolder({})).toBe('active');
    expect(orderLifecycleReady([{}])).toBe(false);
    expect(orderLifecycleReady([{ archived_at: null }])).toBe(false);
    expect(orderLifecycleReady([{ archived_at: null, deleted_at: null }, {}])).toBe(false);
    expect(orderLifecycleReady([{ archived_at: null, deleted_at: null }])).toBe(true);
    expect(orderLifecycleReady([])).toBe(true);
    expect(orderFolder({ archived_at: '2026-11-25' })).toBe('archived');
    expect(orderFolder({ archived_at: '2026-11-25', deleted_at: '2026-11-25' })).toBe('trash');
  });
  it('requires explicit permanent confirmation and rejects lifecycle-field injection', () => {
    const id = '30000000-0000-4000-8000-000000000001';
    expect(commandSchema.safeParse({ action: 'purge_order', payload: { id } }).success).toBe(false);
    expect(
      commandSchema.safeParse({
        action: 'archive_order',
        payload: { id, deleted_at: '2026-11-25' },
      }).success,
    ).toBe(false);
    expect(commandSchema.safeParse({ action: 'restore_order', payload: { id } }).success).toBe(
      true,
    );
  });
});
