import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setLoading(true); api.get(`/audit-logs?page=${page}&limit=20`).then(({ data }) => { setLogs(data.data); setTotal(data.pagination.total); }).finally(() => setLoading(false)); }, [page]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Audit Logs</h1>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div className="card" style={{ padding: 0 }}><div className="table-container"><table className="data-table"><thead><tr><th>Action</th><th>Entity</th><th>User</th><th>Previous</th><th>New</th><th>Date</th></tr></thead><tbody>
          {logs.map((l: any) => (
            <tr key={l.id}><td><span className="badge badge-primary">{l.action}</span></td><td>{l.entity} {l.entityId ? `(${l.entityId.slice(0, 8)}...)` : ''}</td><td>{l.user?.firstName} {l.user?.lastName}</td><td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.previousValue ? JSON.stringify(l.previousValue) : '—'}</td><td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.newValue ? JSON.stringify(l.newValue) : '—'}</td><td style={{ fontSize: 12 }}>{new Date(l.createdAt).toLocaleString()}</td></tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No audit logs</td></tr>}
        </tbody></table></div></div>
      )}
      {totalPages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><span className="pagination-info">Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>}
    </div>
  );
}
