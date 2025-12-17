import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useStoreDetailQuery, useUpsertInventoryItemMutation } from '../graphql/generated/urql';

export function StoreDetailPage() {
  const params = useParams();
  const storeId = params.storeId ?? '';

  const [{ data, fetching, error }, reexecute] = useStoreDetailQuery({
    variables: { id: storeId },
    pause: !storeId,
  });

  const [{ fetching: savingMutation }, upsertInventoryItem] = useUpsertInventoryItemMutation();

  const store = data?.store;
  const summary = data?.storeInventorySummary;
  const items = store?.inventoryItems ?? [];

  const [editingId, setEditingId] = useState<string>('');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editQty, setEditQty] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const current = useMemo(() => items.find((i) => i.id === editingId), [items, editingId]);

  if (!storeId) return <ErrorState title="Bad URL" details="Missing storeId param." />;

  if (fetching) return <LoadingState title="Loading store…" />;
  if (error) return <ErrorState title="Could not load store" details={error.message} />;

  if (!store) return <EmptyState title="Store not found" details={<Link to="/">Back to inventory</Link>} />;

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
        input: { storeId: store.id, productId: current.product.id, price, quantity: qty },
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
      <section style={{ border: '1px solid #e6e6e6', padding: 12, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#666', fontSize: 12 }}>
              <Link to="/">Inventory</Link> / Store
            </div>
            <h3 style={{ margin: '6px 0' }}>{store.name}</h3>
            {store.location ? <div style={{ color: '#555' }}>{store.location}</div> : null}
          </div>
          {summary ? (
            <div style={{ display: 'grid', gap: 4, textAlign: 'right' }}>
              <div>
                Total value: <b>{summary.totalValue}</b>
              </div>
              <div>
                SKUs: <b>{summary.totalSkus}</b> · Qty: <b>{summary.totalQuantity}</b>
              </div>
              <div>
                Low stock (≤5): <b>{summary.lowStockCount}</b>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState title="No inventory items in this store" details="Seed should normally create some." />
      ) : (
        <section style={{ border: '1px solid #e6e6e6', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Product</th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #eee' }}>Category</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>Price</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }}>Value</th>
                <th style={{ textAlign: 'right', padding: 10, borderBottom: '1px solid #eee' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const isEditing = it.id === editingId;
                return (
                  <tr key={it.id}>
                    <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}>{it.product.name}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2' }}>{it.product.category}</td>
                    <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                      {isEditing ? (
                        <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} inputMode="decimal" />
                      ) : (
                        it.price
                      )}
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                      {isEditing ? (
                        <input value={editQty} onChange={(e) => setEditQty(e.target.value)} inputMode="numeric" />
                      ) : (
                        it.quantity
                      )}
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                      {isEditing ? '—' : it.inventoryValue}
                    </td>
                    <td style={{ padding: 10, borderBottom: '1px solid #f2f2f2', textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button disabled={saving || savingMutation} onClick={save}>
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
                        <button onClick={() => startEdit(it)}>Edit</button>
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
    </div>
  );
}


