import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const { isManager, isAdmin } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', sku: '', description: '', price: '', minimumStockLevel: '10', categoryId: '' });

  const fetchProducts = () => {
    setLoading(true);
    api.get(`/products?page=${page}&limit=10&search=${search}`).then(({ data }) => {
      setProducts(data.data); setTotal(data.pagination.total);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [page, search]);
  useEffect(() => { api.get('/categories').then(({ data }) => setCategories(data.data)); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', sku: '', description: '', price: '', minimumStockLevel: '10', categoryId: '' }); setShowModal(true); };
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, sku: p.sku, description: p.description || '', price: String(p.price), minimumStockLevel: String(p.minimumStockLevel), categoryId: p.categoryId }); setShowModal(true); };

  const handleSubmit = async () => {
    try {
      const payload = { name: form.name, sku: form.sku, description: form.description, price: Number(form.price), minimumStockLevel: Number(form.minimumStockLevel), categoryId: form.categoryId };
      if (editing) { await api.put(`/products/${editing.id}`, payload); toast.success('Product updated'); }
      else { await api.post('/products', payload); toast.success('Product created'); }
      setShowModal(false); fetchProducts();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Product deleted'); fetchProducts(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const stockClass = (p: any) => p.currentStock === 0 ? 'stock-out' : p.currentStock <= p.minimumStockLevel ? 'stock-low' : 'stock-ok';
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div className="toolbar-left">
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Products</h1>
          <div className="search-input"><HiOutlineSearch /><input className="form-input" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
        </div>
        {isManager && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Add Product</button>}
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Min Level</th>{isManager && <th>Actions</th>}</tr></thead><tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td>
                <td><span className="badge badge-muted">{p.sku}</span></td>
                <td>{p.category?.name}</td>
                <td>${Number(p.price).toFixed(2)}</td>
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

      {totalPages > 1 && <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="pagination-info">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>}

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
                <div className="form-group"><label className="form-label">Price ($)</label><input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Min Stock Level</label><input className="form-input" type="number" value={form.minimumStockLevel} onChange={(e) => setForm({ ...form, minimumStockLevel: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
