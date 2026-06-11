import { useEffect, useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle } from 'react-icons/hi';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = () => { setLoading(true); api.get(`/notifications?page=${page}&limit=20`).then(({ data }) => { setNotifications(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, [page]);

  const markRead = async (id: string) => { await api.patch(`/notifications/${id}/read`); fetch(); };
  const markAllRead = async () => { await api.patch('/notifications/read-all'); toast.success('All marked as read'); fetch(); };

  const totalPages = Math.ceil(total / 20);
  const typeIcon: Record<string, string> = { LOW_STOCK: '⚠️', ORDER: '📦', SYSTEM: '🔔' };

  return (
    <div className="fade-in">
      <div className="toolbar"><h1 style={{ fontSize: 24, fontWeight: 800 }}>Notifications</h1><button className="btn btn-secondary" onClick={markAllRead}><HiOutlineCheckCircle /> Mark All Read</button></div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n: any) => (
            <div key={n.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: n.isRead ? 0.6 : 1, cursor: 'pointer' }} onClick={() => !n.isRead && markRead(n.id)}>
              <span style={{ fontSize: 24 }}>{typeIcon[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.message}</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(n.createdAt).toLocaleString()}</div>
              {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', flexShrink: 0 }} />}
            </div>
          ))}
          {notifications.length === 0 && <div className="empty-state"><h3>No notifications</h3><p>You're all caught up!</p></div>}
        </div>
      )}
      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span className="pagination-info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </div>
  );
}
