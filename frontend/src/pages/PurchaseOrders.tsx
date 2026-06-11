import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function PurchaseOrders() {
  const { isManager } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [{ productId: '', quantity: '', unitPrice: '' }] });

  const fetch = () => { setLoading(true); api.get(`/orders?page=${page}&limit=10`).then(({ data }) => { setOrders(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, [page]);
  useEffect(() => { api.get('/suppliers?limit=100').then(({ data }) => setSuppliers(data.data)); api.get('/products?limit=100').then(({ data }) => setProducts(data.data)); }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: '', unitPrice: '' }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, val: string) => { const items = [...form.items]; (items[i] as any)[field] = val; setForm({ ...form, items }); };

  const handleCreate = async () => {
    try {
      const payload = { supplierId: form.supplierId, notes: form.notes, items: form.items.map((i) => ({ productId: i.productId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })) };
      await api.post('/orders', payload); toast.success('Order created'); setShowCreate(false); fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleStatus = async (id: string, status: string) => {
    try { await api.patch(`/orders/${id}/status`, { status }); toast.success(`Order ${status.toLowerCase()}`); fetch(); if (showDetail) { const { data } = await api.get(`/orders/${id}`); setShowDetail(data.data); } } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const viewDetail = async (id: string) => { const { data } = await api.get(`/orders/${id}`); setShowDetail(data.data); };

  const statusBadge: Record<string, string> = { CREATED: 'badge-info', APPROVED: 'badge-primary', RECEIVED: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-danger' };
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="fade-in">
      <div className="toolbar"><h1 style={{ fontSize: 24, fontWeight: 800 }}>Purchase Orders</h1>
        {isManager && <button className="btn btn-primary" onClick={() => { setForm({ supplierId: '', notes: '', items: [{ productId: '', quantity: '', unitPrice: '' }] }); setShowCreate(true); }}><HiOutlinePlus /> Create Order</button>}
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr><th>Order #</th><th>Supplier</th><th>Status</th><th>Items</th><th>Total</th><th>Created</th><th>Actions</th></tr></thead><tbody>
          {orders.map((o: any) => (
            <tr key={o.id}><td style={{ color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => viewDetail(o.id)}>{o.orderNumber}</td><td>{o.supplier?.name}</td><td><span className={`badge ${statusBadge[o.status]}`}>{o.status}</span></td><td>{o._count?.items || 0}</td><td style={{ fontWeight: 600 }}>${Number(o.totalAmount).toFixed(2)}</td><td style={{ fontSize: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                {o.status === 'CREATED' && isManager && <><button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'APPROVED')}>Approve</button><button className="btn btn-sm btn-danger" onClick={() => handleStatus(o.id, 'CANCELLED')}>Cancel</button></>}
                {o.status === 'APPROVED' && isManager && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'RECEIVED')}>Receive</button>}
                {o.status === 'RECEIVED' && isManager && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'COMPLETED')}>Complete</button>}
              </div></td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No orders</td></tr>}
        </tbody></table></div></div>
      )}
      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span className="pagination-info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}><div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header"><h2>Order {showDetail.orderNumber}</h2><button className="modal-close" onClick={() => setShowDetail(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><span className="form-label">Supplier</span><p>{showDetail.supplier?.name}</p></div>
              <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[showDetail.status]}`}>{showDetail.status}</span></p></div>
              <div><span className="form-label">Total</span><p style={{ fontWeight: 700, fontSize: 18 }}>${Number(showDetail.totalAmount).toFixed(2)}</p></div>
              <div><span className="form-label">Created By</span><p>{showDetail.createdBy?.firstName} {showDetail.createdBy?.lastName}</p></div>
            </div>
            <h3 style={{ marginBottom: 12 }}>Items</h3>
            <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
              {showDetail.items?.map((i: any) => (<tr key={i.id}><td>{i.product?.name}</td><td>{i.product?.sku}</td><td>{i.quantity}</td><td>${Number(i.unitPrice).toFixed(2)}</td><td style={{ fontWeight: 600 }}>${Number(i.totalPrice).toFixed(2)}</td></tr>))}
            </tbody></table></div>
          </div>
        </div></div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}><div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header"><h2>Create Purchase Order</h2><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Supplier</label><select className="form-select" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}><option value="">Select supplier</option>{suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><label className="form-label" style={{ margin: 0 }}>Items</label><button className="btn btn-sm btn-secondary" onClick={addItem}>+ Add Item</button></div>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                <select className="form-select" value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}><option value="">Product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <input className="form-input" type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                <input className="form-input" type="number" step="0.01" placeholder="Price" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                {form.items.length > 1 && <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)}>×</button>}
              </div>
            ))}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="btn btn-primary" onClick={handleCreate}>Create Order</button></div>
        </div></div>
      )}
    </div>
  );
}
