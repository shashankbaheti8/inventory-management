import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineAdjustments } from 'react-icons/hi';

export default function Inventory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'stock-in' | 'stock-out' | 'adjustment'>('stock-in');
  const [form, setForm] = useState({ productId: '', quantity: '', reason: '', reference: '' });

  const fetchHistory = () => {
    setLoading(true);
    api.get(`/inventory/history?page=${page}&limit=15`).then(({ data }) => { setTransactions(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, [page]);
  useEffect(() => { api.get('/products?limit=100').then(({ data }) => setProducts(data.data)); }, []);

  const openModal = (type: 'stock-in' | 'stock-out' | 'adjustment') => { setModalType(type); setForm({ productId: '', quantity: '', reason: '', reference: '' }); setShowModal(true); };

  const handleSubmit = async () => {
    try {
      const payload = { productId: form.productId, quantity: Number(form.quantity), reason: form.reason, reference: form.reference || undefined };
      await api.post(`/inventory/${modalType}`, payload);
      toast.success(`${modalType.replace('-', ' ')} successful`);
      setShowModal(false); fetchHistory();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const typeIcon: Record<string, string> = { STOCK_IN: '↗', STOCK_OUT: '↘', ADJUSTMENT: '⇄', RETURN: '↩', TRANSFER: '↔' };
  const typeBadge: Record<string, string> = { STOCK_IN: 'badge-success', STOCK_OUT: 'badge-danger', ADJUSTMENT: 'badge-warning', RETURN: 'badge-info', TRANSFER: 'badge-primary' };
  const totalPages = Math.ceil(total / 15);

  return (
    <div className="fade-in">
      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Inventory Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => openModal('stock-in')}><HiOutlineArrowDown /> Stock In</button>
          <button className="btn btn-secondary" onClick={() => openModal('stock-out')}><HiOutlineArrowUp /> Stock Out</button>
          <button className="btn btn-secondary" onClick={() => openModal('adjustment')}><HiOutlineAdjustments /> Adjust</button>
        </div>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>Type</th><th>Quantity</th><th>Previous</th><th>New</th><th>Reason</th><th>By</th><th>Date</th></tr></thead><tbody>
            {transactions.map((t: any) => (
              <tr key={t.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.product?.name} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({t.product?.sku})</span></td>
                <td><span className={`badge ${typeBadge[t.transactionType] || 'badge-muted'}`}>{typeIcon[t.transactionType]} {t.transactionType.replace('_', ' ')}</span></td>
                <td style={{ fontWeight: 700 }}>{t.quantity}</td>
                <td>{t.previousStock}</td>
                <td style={{ fontWeight: 600 }}>{t.newStock}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.reason || '—'}</td>
                <td>{t.createdBy?.firstName} {t.createdBy?.lastName}</td>
                <td style={{ fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>No transactions</td></tr>}
          </tbody></table></div>
        </div>
      )}

      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span className="pagination-info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>{modalType === 'stock-in' ? '📥 Stock In' : modalType === 'stock-out' ? '📤 Stock Out' : '⚖️ Adjustment'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Product</label><select className="form-select" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}><option value="">Select product</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Reason</label><textarea className="form-textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g., Monthly restock" /></div>
            {modalType !== 'adjustment' && <div className="form-group"><label className="form-label">Reference (optional)</label><input className="form-input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g., PO number" /></div>}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>Confirm</button></div>
        </div></div>
      )}
    </div>
  );
}
