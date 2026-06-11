import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function Suppliers() {
  const { isManager, isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', contactPerson: '' });

  const fetch = () => { setLoading(true); api.get(`/suppliers?page=${page}&limit=10&search=${search}`).then(({ data }) => { setSuppliers(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, [page, search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '', contactPerson: '' }); setShowModal(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ name: s.name, email: s.email || '', phone: s.phone || '', address: s.address || '', contactPerson: s.contactPerson || '' }); setShowModal(true); };

  const handleSubmit = async () => {
    try {
      if (editing) { await api.put(`/suppliers/${editing.id}`, form); toast.success('Updated'); }
      else { await api.post('/suppliers', form); toast.success('Created'); }
      setShowModal(false); fetch();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Deleted'); fetch(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div className="toolbar-left"><h1 style={{ fontSize: 24, fontWeight: 800 }}>Suppliers</h1><div className="search-input"><HiOutlineSearch /><input className="form-input" placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div>
        {isManager && <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Add Supplier</button>}
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Orders</th>{isManager && <th>Actions</th>}</tr></thead><tbody>
          {suppliers.map((s: any) => (
            <tr key={s.id}><td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td><td>{s.contactPerson || '—'}</td><td>{s.email || '—'}</td><td>{s.phone || '—'}</td><td><span className="badge badge-primary">{s._count?.purchaseOrders || 0}</span></td>
              {isManager && <td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)}><HiOutlinePencil /></button>{isAdmin && <button className="btn btn-ghost btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s.id)}><HiOutlineTrash /></button>}</div></td>}
            </tr>
          ))}
          {suppliers.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No suppliers</td></tr>}
        </tbody></table></div></div>
      )}
      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span className="pagination-info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>{editing ? 'Edit' : 'Add'} Supplier</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-row"><div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div><div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Address</label><textarea className="form-textarea" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></div>
        </div></div>
      )}
    </div>
  );
}
