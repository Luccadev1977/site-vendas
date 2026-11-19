import 'server-only';
type RangeSource = {
  range(
    from: number,
    to: number,
  ): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;
};
/** Paginate explicitly: Supabase's default row cap must never truncate financial totals. */
export async function readAll<T>(query: RangeSource): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await query.range(offset, offset + 499);
    if (error) throw new Error('Não foi possível carregar todos os registros.');
    rows.push(...((data || []) as T[]));
    if (!data || data.length < 500) return rows;
  }
}
