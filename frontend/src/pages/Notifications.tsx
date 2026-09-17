import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import { formatDateTime } from '../utils/format';
import Pagination from '../components/Pagination';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const { setUnreadCount } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  const fetch = () => { setLoading(true); api.get(`/notifications?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`).then(({ data }) => { setNotifications(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, [page, limit, sortBy, sortOrder]);

  const markRead = async (id: string) => { await api.patch(`/notifications/${id}/read`); setUnreadCount(prev => Math.max(0, prev - 1)); fetch(); };
  const markAllRead = async () => { await api.patch('/notifications/read-all'); setUnreadCount(0); toast.success('All marked as read'); fetch(); };

  const totalPages = Math.ceil(total / limit);
  const typeIcon: Record<string, string> = { LOW_STOCK: '⚠️', ORDER: '📦', SYSTEM: '🔔' };

  return (
    <div className="fade-in">
      <div className="toolbar">
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Notifications</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <select 
            className="form-select" 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [b, o] = e.target.value.split('-');
              setSortBy(b);
              setSortOrder(o as 'asc' | 'desc');
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="type-asc">Type (A-Z)</option>
            <option value="isRead-asc">Unread First</option>
          </select>
          <button className="btn btn-secondary" onClick={markAllRead}><HiOutlineCheckCircle /> Mark All Read</button>
        </div>
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n: any) => (
            <div key={n.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: n.isRead ? 0.6 : 1, cursor: 'pointer' }} onClick={() => !n.isRead && markRead(n.id)}>
              <span style={{ fontSize: 24 }}>{typeIcon[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.message}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(n.createdAt)}</div>
              {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />}
            </div>
          ))}
          {notifications.length === 0 && <div className="empty-state"><h3>No notifications</h3><p>You're all caught up!</p></div>}
        </div>
      )}
      <Pagination page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} options={[10, 20, 50, 100]} />
    </div>
  );
}
