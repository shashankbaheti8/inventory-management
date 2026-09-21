import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatCurrency } from '../utils/format';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import SearchableSelect from '../components/SearchableSelect';

export default function PurchaseOrders() {
  const { isManager } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [{ productId: '', quantity: '', unitPrice: '' }] });
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    });
    if (statusFilter) params.set('status', statusFilter);
    if (supplierFilter) params.set('supplierId', supplierFilter);
    api.get(`/orders?${params}`).then(({ data }) => {
      setOrders(data.data);
      setTotal(data.pagination.total);
    }).finally(() => setLoading(false));
  };

  const hasFilters = statusFilter || supplierFilter;
  const resetFilters = () => { setStatusFilter(''); setSupplierFilter(''); setPage(1); };
  useEffect(() => { fetch(); }, [page, limit, statusFilter, supplierFilter, sortBy, sortOrder]);
  useEffect(() => {
    api.get('/suppliers?limit=100').then(({ data }) => setSuppliers(data.data));
    api.get('/products?limit=100').then(({ data }) => setProducts(data.data));
  }, []);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

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
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fade-in">
      <div className="toolbar"><h1 style={{ fontSize: 24, fontWeight: 800 }}>Purchase Orders</h1>
        {isManager && <button className="btn btn-primary" onClick={() => { setForm({ supplierId: '', notes: '', items: [{ productId: '', quantity: '', unitPrice: '' }] }); setShowCreate(true); }}><HiOutlinePlus /> Create Order</button>}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select className="form-select filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="CREATED">Created</option>
          <option value="APPROVED">Approved</option>
          <option value="RECEIVED">Received</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select className="form-select filter-select" value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}>
          <option value="">All Suppliers</option>
          {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {hasFilters && <button className="btn btn-ghost" onClick={resetFilters} style={{ gap: 4, whiteSpace: 'nowrap' }}><HiOutlineX /> Clear</button>}
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr>
          <th>Order #</th>
          <th>Supplier</th>
          <th>Status</th>
          <th>Items</th>
          <SortableHeader label="Total" field="totalAmount" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          <SortableHeader label="Created" field="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          {isManager && <th>Actions</th>}
        </tr></thead><tbody>
          {orders.map((o: any) => (
            <tr key={o.id}><td style={{ color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => viewDetail(o.id)}>{o.orderNumber}</td><td>{o.supplier?.name}</td><td><span className={`badge ${statusBadge[o.status]}`}>{o.status}</span></td><td>{o._count?.items || 0}</td><td style={{ fontWeight: 600 }}>{formatCurrency(o.totalAmount)}</td><td style={{ fontSize: 12 }}>{formatDate(o.createdAt)}</td>
              {isManager && <td><div style={{ display: 'flex', gap: 4 }}>
                {o.status === 'CREATED' && <><button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'APPROVED')}>Approve</button><button className="btn btn-sm btn-danger" onClick={() => handleStatus(o.id, 'CANCELLED')}>Cancel</button></>}
                {o.status === 'APPROVED' && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'RECEIVED')}>Receive</button>}
                {o.status === 'RECEIVED' && <button className="btn btn-sm btn-primary" onClick={() => handleStatus(o.id, 'COMPLETED')}>Complete</button>}
              </div></td>}
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No orders</td></tr>}
        </tbody></table></div></div>
      )}
      <Pagination page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}><div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header"><h2>Order {showDetail.orderNumber}</h2><button className="modal-close" onClick={() => setShowDetail(null)}>×</button></div>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><span className="form-label">Supplier</span><p>{showDetail.supplier?.name}</p></div>
              <div><span className="form-label">Status</span><p><span className={`badge ${statusBadge[showDetail.status]}`}>{showDetail.status}</span></p></div>
              <div><span className="form-label">Total</span><p style={{ fontWeight: 700, fontSize: 18 }}>{formatCurrency(showDetail.totalAmount)}</p></div>
              <div><span className="form-label">Created By</span><p>{showDetail.createdBy?.firstName} {showDetail.createdBy?.lastName}</p></div>
              {showDetail.notes && <div style={{ gridColumn: '1 / -1' }}><span className="form-label">Notes</span><p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{showDetail.notes}</p></div>}
            </div>
            <h3 style={{ marginBottom: 12 }}>Items</h3>
            <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
              {showDetail.items?.map((i: any) => (<tr key={i.id}><td>{i.product?.name}</td><td>{i.product?.sku}</td><td>{i.quantity}</td><td>{formatCurrency(i.unitPrice)}</td><td style={{ fontWeight: 600 }}>{formatCurrency(i.totalPrice)}</td></tr>))}
            </tbody></table></div>
          </div>
        </div></div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}><div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header"><h2>Create Purchase Order</h2><button className="modal-close" onClick={() => setShowCreate(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Supplier</label>
              <SearchableSelect
                options={suppliers.map((s: any) => ({ value: s.id, label: s.name }))}
                value={form.supplierId}
                onChange={(val) => setForm({ ...form, supplierId: String(val) })}
                placeholder="Select supplier"
              />
            </div>
            <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><label className="form-label" style={{ margin: 0 }}>Items</label><button className="btn btn-sm btn-secondary" onClick={addItem}>+ Add Item</button></div>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 2 }}>
                  <SearchableSelect
                    options={products.map((p: any) => ({ value: p.id, label: p.name }))}
                    value={item.productId}
                    onChange={(val) => updateItem(i, 'productId', String(val))}
                    placeholder="Product"
                  />
                </div>
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
