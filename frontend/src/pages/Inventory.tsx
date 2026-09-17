import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineArrowDown, HiOutlineArrowUp, HiOutlineAdjustments, HiOutlineSearch, HiOutlineX, HiOutlineReply, HiOutlineSwitchHorizontal, HiOutlineInformationCircle } from 'react-icons/hi';
import { formatDateTime } from '../utils/format';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import SearchableSelect from '../components/SearchableSelect';

export default function Inventory() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'stock-in' | 'stock-out' | 'adjustment' | 'return' | 'transfer'>('stock-in');
  const [form, setForm] = useState({ productId: '', quantity: '', reason: '', reference: '' });
  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateRange, setDateRange] = useState('all');

  const fetchHistory = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
    if (typeFilter) params.set('transactionType', typeFilter);
    if (dateFrom) params.set('startDate', dateFrom);
    if (dateTo) params.set('endDate', dateTo);
    api.get(`/inventory/history?${params}`).then(({ data }) => { setTransactions(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false));
  };

  const hasFilters = typeFilter || productSearch || dateFrom || dateTo || dateRange !== 'all';
  const resetFilters = () => { setTypeFilter(''); setProductSearch(''); setDateFrom(''); setDateTo(''); setDateRange('all'); setSortBy('createdAt'); setSortOrder('desc'); setPage(1); };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    const today = new Date();
    
    if (range === 'all' || range === 'custom') {
      setDateFrom('');
      setDateTo('');
    } else if (range === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setDateFrom(yesterday.toISOString().split('T')[0]);
      setDateTo(yesterday.toISOString().split('T')[0]);
    } else if (range === '7days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setDateFrom(past.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    } else if (range === '30days') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setDateFrom(past.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    }
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  useEffect(() => { fetchHistory(); }, [page, limit, typeFilter, dateFrom, dateTo, sortBy, sortOrder]);
  useEffect(() => { api.get('/products?limit=200').then(({ data }) => setProducts(data.data)); }, []);

  // Client-side product name filter (since API doesn't have product search on history)
  const filteredTx = productSearch
    ? transactions.filter(t => t.product?.name?.toLowerCase().includes(productSearch.toLowerCase()) || t.product?.sku?.toLowerCase().includes(productSearch.toLowerCase()))
    : transactions;

  const openModal = (type: 'stock-in' | 'stock-out' | 'adjustment' | 'return' | 'transfer') => { setModalType(type); setForm({ productId: '', quantity: '', reason: '', reference: '' }); setShowModal(true); };

  const handleSubmit = async () => {
    try {
      const payload = { productId: form.productId, quantity: Number(form.quantity), reason: form.reason, reference: form.reference || undefined };
      const endpoint = `/inventory/${modalType}`;
      await api.post(endpoint, payload);
      toast.success('Transaction successful');
      setShowModal(false);
      fetchHistory();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const typeIcon: Record<string, string> = { STOCK_IN: '↗', STOCK_OUT: '↘', ADJUSTMENT: '⇄', RETURN: '↩', TRANSFER: '↔' };
  const typeBadge: Record<string, string> = { STOCK_IN: 'badge-success', STOCK_OUT: 'badge-danger', ADJUSTMENT: 'badge-warning', RETURN: 'badge-info', TRANSFER: 'badge-primary' };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fade-in">
      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Inventory Management</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => openModal('stock-in')}><HiOutlineArrowDown /> Stock In</button>
          <button className="btn btn-secondary" onClick={() => openModal('stock-out')}><HiOutlineArrowUp /> Stock Out</button>
          <button className="btn btn-secondary" onClick={() => openModal('return')}><HiOutlineReply /> Return</button>
          <button className="btn btn-secondary" onClick={() => openModal('transfer')}><HiOutlineSwitchHorizontal /> Transfer</button>
          <button className="btn btn-secondary" onClick={() => openModal('adjustment')}><HiOutlineAdjustments /> Adjust</button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input"><HiOutlineSearch /><input className="form-input" placeholder="Search product name or SKU..." value={productSearch} onChange={(e) => { setProductSearch(e.target.value); }} /></div>
        <select className="form-select filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="STOCK_IN">Stock In</option>
          <option value="STOCK_OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
          <option value="RETURN">Return</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <select className="form-select filter-select" value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value)}>
          <option value="all">All Time</option>
          <option value="yesterday">Yesterday</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
        {dateRange === 'custom' && (
          <>
            <input className="form-input filter-date" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
            <input className="form-input filter-date" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} title="To date" />
          </>
        )}
        {hasFilters && <button className="btn btn-ghost" onClick={resetFilters} style={{ gap: 4, whiteSpace: 'nowrap' }}><HiOutlineX /> Clear</button>}
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container"><table className="data-table"><thead><tr>
          <th>Product</th>
          <th>Type</th>
          <th>Quantity</th>
          <th>Previous</th>
          <th>New</th>
          <th>Reason</th>
          <th>By</th>
          <SortableHeader label="Date" field="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </tr></thead><tbody>
            {filteredTx.map((t: any) => (
              <tr key={t.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.product?.name} <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>({t.product?.sku})</span></td>
                <td><span className={`badge ${typeBadge[t.transactionType] || 'badge-muted'}`}>{typeIcon[t.transactionType]} {t.transactionType.replace('_', ' ')}</span></td>
                <td style={{ fontWeight: 700 }}>{t.quantity}</td>
                <td>{t.previousStock}</td>
                <td style={{ fontWeight: 600 }}>{t.newStock}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.reason || '—'}
                    {t.reference && <HiOutlineInformationCircle title={`Reference: ${t.reference}`} style={{ color: 'var(--text-secondary)', cursor: 'help', flexShrink: 0 }} />}
                  </div>
                </td>
                <td>{t.createdBy?.firstName} {t.createdBy?.lastName}</td>
                <td style={{ fontSize: 12 }}>{formatDateTime(t.createdAt)}</td>
              </tr>
            ))}
            {filteredTx.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>No transactions found</td></tr>}
          </tbody></table></div>
        </div>
      )}

      <Pagination page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>{modalType === 'stock-in' ? '📥 Stock In' : modalType === 'stock-out' ? '📤 Stock Out' : modalType === 'return' ? '↩️ Return' : modalType === 'transfer' ? '🔄 Transfer' : '⚖️ Adjustment'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Product</label>
              <SearchableSelect
                options={products.map((p: any) => ({ value: p.id, label: `${p.name} (${p.sku}) — Stock: ${p.currentStock}` }))}
                value={form.productId}
                onChange={(val) => setForm({ ...form, productId: String(val) })}
                placeholder="Select product"
              />
            </div>
            <div className="form-group"><label className="form-label">Quantity</label><input className="form-input" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Reason</label><textarea className="form-textarea" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={modalType === 'return' ? 'e.g., Customer return' : modalType === 'transfer' ? 'e.g., Sent to warehouse B' : 'e.g., Monthly restock'} /></div>
            {modalType !== 'adjustment' && <div className="form-group"><label className="form-label">Reference (optional)</label><input className="form-input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g., PO number or RMA #" /></div>}
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>Confirm</button></div>
        </div></div>
      )}
    </div>
  );
}
