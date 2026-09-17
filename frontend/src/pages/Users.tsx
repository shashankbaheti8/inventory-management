import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatDate } from '../utils/format';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlinePlus } from 'react-icons/hi';
import Pagination from '../components/Pagination';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
  
  const fetch = () => { setLoading(true); api.get(`/auth/users?page=${page}&limit=${limit}&search=${search}`).then(({ data }) => { setUsers(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, [page, limit, search]);

  const updateRole = async (id: string, role: string) => {
    try { await api.patch(`/auth/users/${id}/role`, { role }); toast.success('Role updated'); fetch(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const toggleActive = async (id: string) => {
    try { await api.patch(`/auth/users/${id}/toggle-active`); toast.success('Status toggled'); fetch(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const createUser = async () => {
    try {
      await api.post('/auth/users', form);
      toast.success('User created successfully');
      setShowModal(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'EMPLOYEE' });
      fetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const roleBadge: any = { ADMIN: 'badge-danger', INVENTORY_MANAGER: 'badge-warning', EMPLOYEE: 'badge-info' };
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fade-in">
      <div className="toolbar">
        <div className="toolbar-left"><h1 style={{ fontSize: 24, fontWeight: 800 }}>User Management</h1><div className="search-input"><HiOutlineSearch /><input className="form-input" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div>
        <div className="toolbar-right"><button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlus /> Add User</button></div>
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Joined</th>
          <th>Actions</th>
        </tr></thead><tbody>
          {users.map((u: any) => (
            <tr key={u.id}><td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.firstName} {u.lastName}</td><td>{u.email}</td><td><span className={`badge ${roleBadge[u.role]}`}>{u.role.replace('_', ' ')}</span></td><td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ fontSize: 12 }}>{formatDate(u.createdAt)}</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}><option value="ADMIN">Admin</option><option value="INVENTORY_MANAGER">Manager</option><option value="EMPLOYEE">Employee</option></select>
                <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleActive(u.id)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
              </div></td>
            </tr>
          ))}
        </tbody></table></div></div>
      )}
      <Pagination page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>Create User</h2><button className="modal-close" onClick={() => setShowModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Last Name (Optional)</label><input className="form-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Password *</label><input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Role *</label>
              <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="EMPLOYEE">Employee</option>
                <option value="INVENTORY_MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={createUser}>Create User</button></div>
        </div></div>
      )}
    </div>
  );
}
