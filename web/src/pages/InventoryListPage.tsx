import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import {
  type InventoryItemSortField,
  type SortDirection,
  useCreateProductMutation,
  useCreateStoreMutation,
  useInventoryItemsQuery,
  useStoresQuery,
  useUpsertInventoryItemMutation,
  type InventoryItemFilterInput,
} from '../graphql/generated/urql';

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

  const [newStoreName, setNewStoreName] = useState<string>('');
  const [newStoreLocation, setNewStoreLocation] = useState<string>('');
  const [storeSubmitError, setStoreSubmitError] = useState<string>('');
  const [storeSubmitSuccess, setStoreSubmitSuccess] = useState<string>('');

  const [newStoreId, setNewStoreId] = useState<string>('');
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('');
  const [newPrice, setNewPrice] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<string>('');
  const [productSubmitError, setProductSubmitError] = useState<string>('');
  const [productSubmitSuccess, setProductSubmitSuccess] = useState<string>('');

  const [{ data: storesData, fetching: storesFetching, error: storesError }, reexecuteStoresQuery] = useStoresQuery();

  type SortKey = 'store' | 'product' | 'category' | 'price' | 'quantity' | 'value';
  const [sortField, setSortField] = useState<InventoryItemSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC');

  const filter = useMemo<InventoryItemFilterInput | undefined>(() => {
    const f: InventoryItemFilterInput = {};

    if (storeId) f.storeId = storeId;

    const trimmedCategory = category.trim();
    if (trimmedCategory) f.category = trimmedCategory;

    const trimmedSearch = search.trim();
    if (trimmedSearch) f.search = trimmedSearch;

    const trimmedMinPrice = minPrice.trim();
    if (trimmedMinPrice) f.minPrice = trimmedMinPrice;

    const trimmedMaxPrice = maxPrice.trim();
    if (trimmedMaxPrice) f.maxPrice = trimmedMaxPrice;

    const trimmedMinQuantity = minQuantity.trim();
    if (trimmedMinQuantity) f.minQuantity = Number(trimmedMinQuantity);

    const trimmedMaxQuantity = maxQuantity.trim();
    if (trimmedMaxQuantity) f.maxQuantity = Number(trimmedMaxQuantity);

    return Object.keys(f).length > 0 ? f : undefined;
  }, [storeId, category, search, minPrice, maxPrice, minQuantity, maxQuantity]);

  const [{ data, fetching, error }, reexecuteInventoryItemsQuery] = useInventoryItemsQuery({
    variables: {
      filter,
      sort: sortField ? { field: sortField, direction: sortDirection } : undefined,
      page,
      pageSize,
    },
  });

  const [createStoreResult, createStore] = useCreateStoreMutation();
  const [createProductResult, createProduct] = useCreateProductMutation();
  const [upsertInventoryItemResult, upsertInventoryItem] = useUpsertInventoryItemMutation();
  const isProductSubmitting = createProductResult.fetching || upsertInventoryItemResult.fetching;
  const isStoreSubmitting = createStoreResult.fetching;

  const items = data?.inventoryItems?.items ?? [];
  const pageInfo = data?.inventoryItems?.pageInfo;
  const total = pageInfo?.total ?? 0;
  const totalPages = pageInfo ? Math.max(1, Math.ceil(pageInfo.total / pageInfo.pageSize)) : 1;
  const currentPage = pageInfo?.page ?? page;

  useEffect(() => {
    if (!pageInfo) return;
    if (page > totalPages) setPage(totalPages);
  }, [pageInfo, page, totalPages]);

  const stores = storesData?.stores ?? [];

  const sortFieldByKey: Record<SortKey, InventoryItemSortField> = {
    store: 'STORE_NAME',
    product: 'PRODUCT_NAME',
    category: 'CATEGORY',
    price: 'PRICE',
    quantity: 'QUANTITY',
    value: 'VALUE',
  };

  function toggleSort(k: SortKey) {
    const nextField = sortFieldByKey[k];
    if (sortField !== nextField) {
      setSortField(nextField);
      setSortDirection('ASC');
      setPage(1);
      return;
    }
    setSortDirection((d) => (d === 'ASC' ? 'DESC' : 'ASC'));
    setPage(1);
  }

  function sortIndicator(k: SortKey) {
    const f = sortFieldByKey[k];
    if (sortField !== f) return '';
    return sortDirection === 'ASC' ? ' ▲' : ' ▼';
  }

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
                {stores.map((s) => (
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
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Prev
              </button>
              <span
                style={{
                  fontSize: 12,
                  color: '#555',
                  minWidth: 92,
                  textAlign: 'center',
                  display: 'inline-block',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                Page <b>{currentPage}</b> / <b>{totalPages}</b>
              </span>
              <button
                disabled={!pageInfo || currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
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
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleSort('store')}
                    style={{ all: 'unset', cursor: 'pointer' }}
                    title="Sort by store"
                  >
                    Store{sortIndicator('store')}
                  </button>
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleSort('product')}
                    style={{ all: 'unset', cursor: 'pointer' }}
                    title="Sort by product"
                  >
                    Product{sortIndicator('product')}
                  </button>
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleSort('category')}
                    style={{ all: 'unset', cursor: 'pointer' }}
                    title="Sort by category"
                  >
                    Category{sortIndicator('category')}
                  </button>
                </th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleSort('price')}
                    style={{ all: 'unset', cursor: 'pointer' }}
                    title="Sort by price"
                  >
                    Price{sortIndicator('price')}
                  </button>
                </th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleSort('quantity')}
                    style={{ all: 'unset', cursor: 'pointer' }}
                    title="Sort by quantity"
                  >
                    Qty{sortIndicator('quantity')}
                  </button>
                </th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleSort('value')}
                    style={{ all: 'unset', cursor: 'pointer' }}
                    title="Sort by inventory value"
                  >
                    Value{sortIndicator('value')}
                  </button>
                </th>
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

      <section style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Create store</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Name</div>
              <input value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} placeholder="e.g. Downtown" />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Location (optional)</div>
              <input
                value={newStoreLocation}
                onChange={(e) => setNewStoreLocation(e.target.value)}
                placeholder="e.g. Warsaw"
              />
            </label>

            <button
              disabled={isStoreSubmitting}
              onClick={async () => {
                setStoreSubmitError('');
                setStoreSubmitSuccess('');

                const name = newStoreName.trim();
                const location = newStoreLocation.trim();

                if (!name) {
                  setStoreSubmitError('Please provide a store name.');
                  return;
                }

                const created = await createStore({ input: { name, location: location || null } });
                if (created.error) {
                  setStoreSubmitError(created.error.message);
                  return;
                }

                const createdStore = created.data?.createStore;
                if (!createdStore?.id) {
                  setStoreSubmitError('Could not create store (missing id).');
                  return;
                }

                setNewStoreName('');
                setNewStoreLocation('');
                setStoreSubmitSuccess('Created.');
                setNewStoreId(createdStore.id);
                reexecuteStoresQuery({ requestPolicy: 'network-only' });
              }}
            >
              {isStoreSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>

          {storeSubmitError ? <div style={{ color: '#b00020' }}>{storeSubmitError}</div> : null}
          {storeSubmitSuccess ? <div style={{ color: '#0a7a2f' }}>{storeSubmitSuccess}</div> : null}
        </div>
      </section>

      <section style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Add new product</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}>
            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Store</div>
              <select value={newStoreId} onChange={(e) => setNewStoreId(e.target.value)}>
                <option value="">Select store…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Name</div>
              <input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="e.g. Cola" />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Category</div>
              <input
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value)}
                placeholder="e.g. Drinks"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Price</div>
              <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="0.00" inputMode="decimal" />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Qty</div>
              <input value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} placeholder="0" inputMode="numeric" />
            </label>

            <button
              disabled={isProductSubmitting || storesFetching}
              onClick={async () => {
                setProductSubmitError('');
                setProductSubmitSuccess('');

                const name = newProductName.trim();
                const category = newProductCategory.trim();
                const price = newPrice.trim();
                const quantity = Number(newQuantity.trim());

                if (!newStoreId) {
                  setProductSubmitError('Please select a store.');
                  return;
                }
                if (!name) {
                  setProductSubmitError('Please provide a product name.');
                  return;
                }
                if (!category) {
                  setProductSubmitError('Please provide a category.');
                  return;
                }
                if (!price) {
                  setProductSubmitError('Please provide a price.');
                  return;
                }
                if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 0) {
                  setProductSubmitError('Quantity must be a whole number (0 or more).');
                  return;
                }

                const created = await createProduct({ input: { name, category } });
                if (created.error) {
                  setProductSubmitError(created.error.message);
                  return;
                }
                const productId = created.data?.createProduct.id;
                if (!productId) {
                  setProductSubmitError('Could not create product (missing id).');
                  return;
                }

                const upserted = await upsertInventoryItem({
                  input: { storeId: newStoreId, productId, price, quantity },
                });
                if (upserted.error) {
                  setProductSubmitError(upserted.error.message);
                  return;
                }

                setNewProductName('');
                setNewProductCategory('');
                setNewPrice('');
                setNewQuantity('');
                setProductSubmitSuccess('Added.');
                reexecuteInventoryItemsQuery({ requestPolicy: 'network-only' });
              }}
            >
              {isProductSubmitting ? 'Adding…' : 'Add'}
            </button>
          </div>

          {productSubmitError ? <div style={{ color: '#b00020' }}>{productSubmitError}</div> : null}
          {productSubmitSuccess ? <div style={{ color: '#0a7a2f' }}>{productSubmitSuccess}</div> : null}
        </div>
      </section>
    </div>
  );
}