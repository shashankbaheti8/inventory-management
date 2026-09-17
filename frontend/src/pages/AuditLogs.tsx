import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatDateTime } from '../utils/format';
import Pagination from '../components/Pagination';
import SortableHeader from '../components/SortableHeader';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/audit-logs?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`)
      .then(({ data }) => { setLogs(data.data); setTotal(data.pagination.total); })
      .finally(() => setLoading(false));
  }, [page, limit, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>Audit Logs</h1>
      {loading ?
        <div className="loading-container">
          <div className="spinner" /></div>
        : (
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>User</th>
                    <th>Previous</th>
                    <th>New</th>
                    <SortableHeader label="Date" field="createdAt" currentSortBy={sortBy} currentSortOrder={sortOrder} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l: any) => (
                    <tr key={l.id}>
                      <td>
                        <span className="badge badge-primary">{l.action}</span>
                      </td>
                      <td>{l.entity} {l.entityId ? `(${l.entityId.slice(0, 8)}...)` : ''}</td>
                      <td>{l.user?.firstName} {l.user?.lastName}</td>
                      <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.previousValue ? JSON.stringify(l.previousValue) : '—'}</td>
                      <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.newValue ? JSON.stringify(l.newValue) : '—'}</td>
                      <td style={{ fontSize: 12 }}>{formatDateTime(l.createdAt)}</td>
                    </tr>
                  ))}
                  {logs.length === 0 &&
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>No audit logs</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      <Pagination page={page} setPage={setPage} totalPages={totalPages} limit={limit} setLimit={setLimit} options={[20, 50, 100]} />
    </div>
  );
}
