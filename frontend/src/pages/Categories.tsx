import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Categories() {
  const { isManager, isAdmin } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetch = () => { setLoading(true); api.get('/categories').then(({ data }) => setCategories(data.data)).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ name: c.name, description: c.description || '' }); setShowModal(true); };

  const handleSubmit = async () => {
    try {
      if (editing) { await api.put(`/categories/${editing.id}`, form); toast.success('Updated'); }
      else { await api.post('/categories', form); toast.success('Created'); }
      setShowModal(false); fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try { await api.delete(`/categories/${id}`); toast.success('Deleted'); fetch(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="toolbar"><h1 style={{ fontSize: 24, fontWeight: 800 }}>Categories</h1>
        {isManager && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Add Category</button>}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Description</th><th>Products</th>{isManager && <th>Actions</th>}</tr></thead><tbody>
          {categories.map((c: any) => (
            <tr key={c.id}><td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td><td>{c.description || '—'}</td><td><span className="badge badge-primary">{c._count?.products || 0}</span></td>
              {isManager && <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-ghost btn-icon" onClick={() => openEdit(c)}><HiOutlinePencil /></button>{isAdmin && <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c.id)}><HiOutlineTrash /></button>}</div></td>}
            </tr>
          ))}
          {categories.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40 }}>No categories</td></tr>}
        </tbody></table></div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>{editing ? 'Edit' : 'Add'} Category</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></div>
        </div></div>
      )}
    </div>
  );
}
