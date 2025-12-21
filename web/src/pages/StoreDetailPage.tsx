import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import {
  useCreateProductMutation,
  useDeleteInventoryItemMutation,
  useStoreDetailQuery,
  useUpdateStoreMutation,
  useUpsertInventoryItemMutation,
} from '../graphql/generated/urql';

export function StoreDetailPage() {
  const params = useParams();
  const storeId = params.storeId ?? '';

  const [{ data, fetching, error }, reexecute] = useStoreDetailQuery({
    variables: { id: storeId },
    pause: !storeId,
  });

  const [{ fetching: savingMutation }, upsertInventoryItem] =
    useUpsertInventoryItemMutation();
  const [{ fetching: creatingProductMutation }, createProduct] =
    useCreateProductMutation();
  const [{ fetching: updatingStoreMutation }, updateStore] =
    useUpdateStoreMutation();
  const [{ fetching: deletingMutation }, deleteInventoryItem] =
    useDeleteInventoryItemMutation();

  const store = data?.store;
  const summary = data?.storeInventorySummary;
  const items = store?.inventoryItems ?? [];

  const [editingId, setEditingId] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editQty, setEditQty] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('');
  const [newProductPrice, setNewProductPrice] = useState<string>('');
  const [newProductQty, setNewProductQty] = useState<string>('');
  const [newProductError, setNewProductError] = useState<string>('');
  const [newProductSuccess, setNewProductSuccess] = useState<string>('');

  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [storeNameDraft, setStoreNameDraft] = useState<string>('');
  const [storeNameError, setStoreNameError] = useState<string>('');
  const [storeNameSuccess, setStoreNameSuccess] = useState<string>('');

  const current = useMemo(
    () => (store?.inventoryItems ?? []).find((i) => i.id === editingId),
    [store?.inventoryItems, editingId],
  );

  if (!storeId)
    return <ErrorState title="Bad URL" details="Missing storeId param." />;

  if (fetching) return <LoadingState title="Loading store…" />;
  if (error)
    return <ErrorState title="Could not load store" details={error.message} />;

  if (!store)
    return (
      <EmptyState
        title="Store not found"
        details={<Link to="/">Back to inventory</Link>}
      />
    );

  async function startEdit(item: (typeof items)[number]) {
    setFormError('');
    setEditingId(item.id);
    setEditPrice(item.price);
    setEditQty(String(item.quantity));
  }

  async function save() {
    setFormError('');
    if (!current) return;
    if (!store) return;

    const price = editPrice.trim();
    const qty = Number(editQty);

    if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(price)) {
      setFormError('Price must be a decimal string like 12.34');
      return;
    }
    if (!Number.isInteger(qty) || qty < 0) {
      setFormError('Quantity must be an integer >= 0');
      return;
    }

    setSaving(true);
    try {
      const res = await upsertInventoryItem({
        input: {
          storeId: store.id,
          productId: current.product.id,
          price,
          quantity: qty,
        },
      });
      if (res.error) {
        setFormError(res.error.message);
        return;
      }
      setEditingId('');
      await reexecute({ requestPolicy: 'network-only' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <section
        style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ color: '#666', fontSize: 12 }}>
              <Link to="/">Inventory</Link> / Store
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {isEditingStoreName ? (
                <>
                  <input
                    value={storeNameDraft}
                    onChange={(e) => setStoreNameDraft(e.target.value)}
                    placeholder="Store name"
                  />
                  <button
                    disabled={updatingStoreMutation}
                    onClick={async () => {
                      setStoreNameError('');
                      setStoreNameSuccess('');
                      const name = storeNameDraft.trim();
                      if (!name) {
                        setStoreNameError('Store name cannot be empty.');
                        return;
                      }
                      const res = await updateStore({
                        id: store.id,
                        input: { name },
                      });
                      if (res.error) {
                        setStoreNameError(res.error.message);
                        return;
                      }
                      setIsEditingStoreName(false);
                      setStoreNameSuccess('Saved.');
                      await reexecute({ requestPolicy: 'network-only' });
                    }}
                  >
                    {updatingStoreMutation ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    disabled={updatingStoreMutation}
                    onClick={() => {
                      setIsEditingStoreName(false);
                      setStoreNameDraft(store.name);
                      setStoreNameError('');
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <h3 style={{ margin: '6px 0' }}>{store.name}</h3>
                  <button
                    disabled={updatingStoreMutation}
                    onClick={() => {
                      setStoreNameError('');
                      setStoreNameSuccess('');
                      setStoreNameDraft(store.name);
                      setIsEditingStoreName(true);
                    }}
                  >
                    Edit name
                  </button>
                </>
              )}
            </div>
            {store.location ? (
              <div style={{ color: '#555' }}>{store.location}</div>
            ) : null}
            {storeNameError ? (
              <div style={{ color: '#b00020', marginTop: 6 }}>
                {storeNameError}
              </div>
            ) : null}
            {storeNameSuccess ? (
              <div style={{ color: '#0a7a2f', marginTop: 6 }}>
                {storeNameSuccess}
              </div>
            ) : null}
          </div>
          {summary ? (
            <div style={{ display: 'grid', gap: 4, textAlign: 'right' }}>
              <div>
                Total value: <b>{summary.totalValue}</b>
              </div>
              <div>
                SKUs: <b>{summary.totalSkus}</b> · Qty:{' '}
                <b>{summary.totalQuantity}</b>
              </div>
              <div>
                Low stock (≤5): <b>{summary.lowStockCount}</b>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState
          title="No inventory items in this store"
          details="Seed should normally create some."
        />
      ) : (
        <section
          style={{
            border: '1px solid #e6e6e6',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 10,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  Product
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 10,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: 10,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  Price
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: 10,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: 10,
                    borderBottom: '1px solid #eee',
                  }}
                >
                  Value
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: 10,
                    borderBottom: '1px solid #eee',
                  }}
                />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const isEditing = it.id === editingId;
                return (
                  <tr key={it.id}>
                    <td
                      style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}
                    >
                      {it.product.name}
                    </td>
                    <td
                      style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}
                    >
                      {it.product.category}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: '1px solid #f2f2f2',
                        textAlign: 'right',
                      }}
                    >
                      {isEditing ? (
                        <input
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          inputMode="decimal"
                        />
                      ) : (
                        it.price
                      )}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: '1px solid #f2f2f2',
                        textAlign: 'right',
                      }}
                    >
                      {isEditing ? (
                        <input
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          inputMode="numeric"
                        />
                      ) : (
                        it.quantity
                      )}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: '1px solid #f2f2f2',
                        textAlign: 'right',
                      }}
                    >
                      {isEditing ? '—' : it.inventoryValue}
                    </td>
                    <td
                      style={{
                        padding: 10,
                        borderBottom: '1px solid #f2f2f2',
                        textAlign: 'right',
                      }}
                    >
                      {isEditing ? (
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            disabled={saving || savingMutation}
                            onClick={save}
                          >
                            {saving || savingMutation ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            disabled={saving || savingMutation}
                            onClick={() => {
                              setEditingId('');
                              setFormError('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                          }}
                        >
                          <button
                            disabled={deletingMutation}
                            onClick={() => startEdit(it)}
                          >
                            Edit
                          </button>
                          <button
                            disabled={deletingMutation}
                            onClick={async () => {
                              setFormError('');
                              if (!store) return;
                              const ok = window.confirm(
                                `Remove "${it.product.name}" from this store?`,
                              );
                              if (!ok) return;
                              const res = await deleteInventoryItem({
                                storeId: store.id,
                                productId: it.product.id,
                              });
                              if (res.error) {
                                setFormError(res.error.message);
                                return;
                              }
                              await reexecute({
                                requestPolicy: 'network-only',
                              });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {formError ? (
            <div style={{ padding: 12 }}>
              <ErrorState title="Could not save" details={formError} />
            </div>
          ) : null}
        </section>
      )}

      <section
        style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 12 }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 600 }}>Add new product</div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'end',
            }}
          >
            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Name</div>
              <input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="e.g. Cola"
              />
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
              <input
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />
            </label>

            <label style={{ display: 'grid', gap: 4 }}>
              <div style={{ fontSize: 12, color: '#555' }}>Qty</div>
              <input
                value={newProductQty}
                onChange={(e) => setNewProductQty(e.target.value)}
                placeholder="0"
                inputMode="numeric"
              />
            </label>

            <button
              disabled={savingMutation || creatingProductMutation || saving}
              onClick={async () => {
                setNewProductError('');
                setNewProductSuccess('');
                if (!store) return;

                const name = newProductName.trim();
                const category = newProductCategory.trim();
                const price = newProductPrice.trim();
                const qty = Number(newProductQty);

                if (!name) {
                  setNewProductError('Please provide a product name.');
                  return;
                }
                if (!category) {
                  setNewProductError('Please provide a category.');
                  return;
                }
                if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(price)) {
                  setNewProductError(
                    'Price must be a decimal string like 12.34',
                  );
                  return;
                }
                if (!Number.isInteger(qty) || qty < 0) {
                  setNewProductError('Quantity must be an integer >= 0');
                  return;
                }

                const created = await createProduct({
                  input: { name, category },
                });
                if (created.error) {
                  setNewProductError(created.error.message);
                  return;
                }
                const productId = created.data?.createProduct.id;
                if (!productId) {
                  setNewProductError('Could not create product (missing id).');
                  return;
                }

                const upserted = await upsertInventoryItem({
                  input: { storeId: store.id, productId, price, quantity: qty },
                });
                if (upserted.error) {
                  setNewProductError(upserted.error.message);
                  return;
                }

                setNewProductName('');
                setNewProductCategory('');
                setNewProductPrice('');
                setNewProductQty('');
                setNewProductSuccess('Added.');
                await reexecute({ requestPolicy: 'network-only' });
              }}
            >
              {savingMutation || creatingProductMutation ? 'Adding…' : 'Add'}
            </button>
          </div>

          {newProductError ? (
            <div style={{ color: '#b00020' }}>{newProductError}</div>
          ) : null}
          {newProductSuccess ? (
            <div style={{ color: '#0a7a2f' }}>{newProductSuccess}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
