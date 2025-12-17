import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useInventoryItemsQuery, useStoresQuery } from '../graphql/generated/urql';

export function InventoryListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [storeId, setStoreId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minQuantity, setMinQuantity] = useState<string>('');
  const [maxQuantity, setMaxQuantity] = useState<string>('');

  const [{ data: storesData, fetching: storesFetching, error: storesError }] = useStoresQuery();

  const filter = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (storeId) f.storeId = storeId;
    if (category.trim()) f.category = category.trim();
    if (search.trim()) f.search = search.trim();
    if (minPrice.trim()) f.minPrice = minPrice.trim();
    if (maxPrice.trim()) f.maxPrice = maxPrice.trim();
    if (minQuantity.trim()) f.minQuantity = Number(minQuantity);
    if (maxQuantity.trim()) f.maxQuantity = Number(maxQuantity);
    return f;
  }, [storeId, category, search, minPrice, maxPrice, minQuantity, maxQuantity]);

  const [{ data, fetching, error }] = useInventoryItemsQuery({
    variables: { filter: filter as any, page, pageSize },
  });

  const items = data?.inventoryItems?.items ?? [];
  const pageInfo = data?.inventoryItems?.pageInfo;
  const total = pageInfo?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Store</div>
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All stores</option>
                {(storesData?.stores ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Category</div>
              <input
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. Snacks"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Search</div>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="product or store name"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Min price</div>
              <input
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="0.00"
                inputMode="decimal"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Max price</div>
              <input
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                placeholder="99.99"
                inputMode="decimal"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Min qty</div>
              <input
                value={minQuantity}
                onChange={(e) => {
                  setMinQuantity(e.target.value);
                  setPage(1);
                }}
                placeholder="0"
                inputMode="numeric"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Max qty</div>
              <input
                value={maxQuantity}
                onChange={(e) => {
                  setMaxQuantity(e.target.value);
                  setPage(1);
                }}
                placeholder="100"
                inputMode="numeric"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ color: '#555' }}>
              {pageInfo ? (
                <>
                  Showing <b>{items.length}</b> of <b>{total}</b> items
                </>
              ) : (
                '—'
              )}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#555' }}>Page size</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <span style={{ fontSize: 12, color: '#555' }}>
                Page <b>{page}</b> / <b>{totalPages}</b>
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      {storesFetching ? null : storesError ? (
        <ErrorState title="Could not load stores" details={storesError.message} />
      ) : null}

      {fetching ? (
        <LoadingState title="Loading inventory…" />
      ) : error ? (
        <ErrorState title="Could not load inventory" details={error.message} />
      ) : items.length === 0 ? (
        <EmptyState title="No matching inventory items" details="Try relaxing filters." />
      ) : (
        <section style={{ border: '1px solid #e6e6e6', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Store</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Product</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Category</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>Price</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}>
                    <Link to={`/stores/${it.store.id}`}>{it.store.name}</Link>
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}>{it.product.name}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}>{it.product.category}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                    {it.price}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                    {it.quantity}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                    {it.inventoryValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}


