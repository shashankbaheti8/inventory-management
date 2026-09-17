import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatCurrency } from '../utils/format';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';

export default function Reports() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchReport = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
    if (search) params.set('search', search);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (stockStatus) params.set('stockStatus', stockStatus);
    api.get(`/reports/inventory?${params}`).then(({ data }) => {
      setReport(data.data);
      setTotal(data.data.pagination.total);
    }).finally(() => setLoading(false));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  useEffect(() => { fetchReport(); }, [search, categoryFilter, stockStatus, page, limit, sortBy, sortOrder]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data.data)); }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!report) return <div className="empty-state"><h3>Failed to load</h3></div>;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Reports</h1>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-info"><h3>{report.summary.totalProducts}</h3><p>Total Products</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{formatCurrency(report.summary.totalValue)}</h3><p>Total Inventory Value</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{report.summary.lowStockCount}</h3><p>Low Stock Products</p></div></div>
        <div className="stat-card"><div className="stat-info"><h3>{report.summary.outOfStockCount}</h3><p>Out of Stock</p></div></div>
      </div>

      <div className="filter-bar" style={{ marginTop: 24 }}>
        <div className="search-input">
          <HiOutlineSearch />
          <input className="form-input" placeholder="Search product name or SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select filter-select" style={{ width: 200 }} value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="form-select filter-select" style={{ width: 160 }} value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}>
          <option value="">All Stock</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        {(search || categoryFilter || stockStatus) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(''); setCategoryFilter(''); setStockStatus(''); setPage(1); }} style={{ gap: 4, whiteSpace: 'nowrap' }}>
            <HiOutlineX /> Clear
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px' }}><h3 className="card-title">Full Inventory Report</h3></div>
        <div className="table-container"><table className="data-table"><thead><tr>
          <th>Product</th>
          <th>SKU</th>
          <th>Category</th>
          <SortableHeader label="Price" field="price" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          <SortableHeader label="Stock" field="currentStock" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
          <th>Min Level</th>
          <th>Status</th>
          <SortableHeader label="Value" field="value" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
        </tr></thead><tbody>
          {report.products.map((p: any) => {
            const status = p.currentStock === 0 ? 'Out of Stock' : p.currentStock <= p.minimumStockLevel ? 'Low Stock' : 'In Stock';
            const cls = p.currentStock === 0 ? 'badge-danger' : p.currentStock <= p.minimumStockLevel ? 'badge-warning' : 'badge-success';
            return (
              <tr key={p.id}><td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td><td>{p.sku}</td><td>{p.category?.name}</td><td>{formatCurrency(p.price)}</td><td style={{ fontWeight: 700 }}>{p.currentStock}</td><td>{p.minimumStockLevel}</td><td><span className={`badge ${cls}`}>{status}</span></td><td style={{ fontWeight: 600 }}>{formatCurrency(Number(p.price) * p.currentStock)}</td></tr>
            );
          })}
        </tbody></table></div>
      </div>
      <Pagination page={page} setPage={setPage} totalPages={Math.ceil(total / limit)} limit={limit} setLimit={setLimit} />
    </div>
  );
}
