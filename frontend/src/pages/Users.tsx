import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineSearch } from 'react-icons/hi';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = () => { setLoading(true); api.get(`/auth/users?page=${page}&limit=10&search=${search}`).then(({ data }) => { setUsers(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, [page, search]);

  const updateRole = async (id: string, role: string) => {
    try { await api.patch(`/auth/users/${id}/role`, { role }); toast.success('Role updated'); fetch(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const toggleActive = async (id: string) => {
    try { await api.patch(`/auth/users/${id}/toggle-active`); toast.success('Status toggled'); fetch(); } catch (err: any) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const roleBadge: Record<string, string> = { ADMIN: 'badge-danger', INVENTORY_MANAGER: 'badge-warning', EMPLOYEE: 'badge-info' };
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="fade-in">
      <div className="toolbar"><div className="toolbar-left"><h1 style={{ fontSize: 24, fontWeight: 800 }}>User Management</h1><div className="search-input"><HiOutlineSearch /><input className="form-input" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div></div></div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
          {users.map((u: any) => (
            <tr key={u.id}><td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.firstName} {u.lastName}</td><td>{u.email}</td><td><span className={`badge ${roleBadge[u.role]}`}>{u.role.replace('_', ' ')}</span></td><td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td><td style={{ fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td><div style={{ display: 'flex', gap: 4 }}>
                <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }} value={u.role} onChange={(e) => updateRole(u.id, e.target.value)}><option value="ADMIN">Admin</option><option value="INVENTORY_MANAGER">Manager</option><option value="EMPLOYEE">Employee</option></select>
                <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`} onClick={() => toggleActive(u.id)}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
              </div></td>
            </tr>
          ))}
        </tbody></table></div></div>
      )}
      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span className="pagination-info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </div>
  );
}
