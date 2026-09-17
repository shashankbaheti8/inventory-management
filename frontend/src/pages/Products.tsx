import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineInformationCircle } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';
import SearchableSelect from '../components/SearchableSelect';

export default function Products() {
  const { isManager, isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', sku: '', description: '', price: '', minimumStockLevel: '10', categoryId: '' });

  const loadProducts = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit), sortBy, sortOrder });
    if (search) params.set('search', search);
    if (categoryFilter) params.set('categoryId', categoryFilter);
    if (stockStatus === 'low') params.set('lowStock', 'true');
    if (stockStatus === 'out') params.set('outOfStock', 'true');
    api.get(`/products?${params}`).then(({ data }) => {
      setProducts(data.data); setTotal(data.pagination.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  const hasFilters = search || categoryFilter || stockStatus;
  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setStockStatus('');
    setSortBy('createdAt');
    setSortOrder('desc');
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

  useEffect(() => { loadProducts(); }, [search, categoryFilter, stockStatus, page, limit, sortBy, sortOrder]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data.data)); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', sku: '', description: '', price: '', minimumStockLevel: '10', categoryId: '' }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, sku: p.sku, description: p.description || '', price: String(p.price), minimumStockLevel: String(p.minimumStockLevel), categoryId: p.categoryId }); setShowModal(true); };

  const handleSubmit = async () => {
    try {
      const payload = { name: form.name, sku: form.sku, description: form.description, price: Number(form.price), minimumStockLevel: Number(form.minimumStockLevel), categoryId: form.categoryId };
      if (editing) { await api.put(`/products/${editing.id}`, payload); toast.success('Product updated'); }
      else { await api.post('/products', payload); toast.success('Product created'); }
      setShowModal(false); loadProducts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); loadProducts(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const stockClass = (p: any) => p.currentStock === 0 ? 'stock-out' : p.currentStock <= p.minimumStockLevel ? 'stock-low' : 'stock-ok';
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Products</h1>
        </div>
        {isManager && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Add Product</button>}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input"><HiOutlineSearch /><input className="form-input" placeholder="Search by name, SKU or category..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        <select className="form-select filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="form-select filter-select" value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}>
          <option value="">All Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        {hasFilters && <button className="btn btn-ghost" onClick={resetFilters} style={{ gap: 4, whiteSpace: 'nowrap' }}><HiOutlineX /> Clear</button>}
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container"><table className="data-table"><thead><tr>
            <SortableHeader label="Product" field="name" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
            <th>SKU</th>
            <th>Category</th>
            <SortableHeader label="Price" field="price" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label="Stock" field="currentStock" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
            <th>Min Level</th>
            {isManager && <th>Actions</th>}
          </tr></thead><tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.name}
                    {p.description && <HiOutlineInformationCircle title={p.description} style={{ color: 'var(--text-secondary)', cursor: 'help' }} />}
                  </div>
                </td>
                <td><span className="badge badge-muted">{p.sku}</span></td>
                <td>{p.category?.name}</td>
                <td>{formatCurrency(p.price)}</td>
                <td><span className={stockClass(p)} style={{ fontWeight: 700 }}>{p.currentStock}</span></td>
                <td>{p.minimumStockLevel}</td>
                {isManager && <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(p)}><HiOutlinePencil /></button>
                    {isAdmin && <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(p.id)} style={{ color: 'var(--danger)' }}><HiOutlineTrash /></button>}
                  </div>
                </td>}
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>No products found</td></tr>}
          </tbody></table></div>
        </div>
      )}

      <Pagination page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Product' : 'Add Product'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">SKU</label><input className="form-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Price (₹)</label><input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Min Stock Level</label><input className="form-input" type="number" value={form.minimumStockLevel} onChange={(e) => setForm({ ...form, minimumStockLevel: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Category</label>
                <SearchableSelect
                  options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
                  value={form.categoryId}
                  onChange={(val) => setForm({ ...form, categoryId: String(val) })}
                  placeholder="Select category"
                />
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
