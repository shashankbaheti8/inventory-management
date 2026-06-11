import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Reports() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/reports/inventory').then(({ data }) => setReport(data.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!report) return <div className="empty-state"><h3>Failed to load</h3></div>;

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Reports</h1>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon primary">📊</div><div className="stat-info"><h3>{report.summary.totalProducts}</h3><p>Total Products</p></div></div>
        <div className="stat-card"><div className="stat-icon success">💰</div><div className="stat-info"><h3>${report.summary.totalValue.toLocaleString()}</h3><p>Total Inventory Value</p></div></div>
        <div className="stat-card"><div className="stat-icon warning">⚠️</div><div className="stat-info"><h3>{report.summary.lowStockCount}</h3><p>Low Stock Products</p></div></div>
        <div className="stat-card"><div className="stat-icon danger">🚫</div><div className="stat-info"><h3>{report.summary.outOfStockCount}</h3><p>Out of Stock</p></div></div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 24px' }}><h3 className="card-title">Full Inventory Report</h3></div>
        <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Min Level</th><th>Status</th><th>Value</th></tr></thead><tbody>
          {report.products.map((p: any) => {
            const status = p.currentStock === 0 ? 'Out of Stock' : p.currentStock <= p.minimumStockLevel ? 'Low Stock' : 'In Stock';
            const cls = p.currentStock === 0 ? 'badge-danger' : p.currentStock <= p.minimumStockLevel ? 'badge-warning' : 'badge-success';
            return (
              <tr key={p.id}><td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.name}</td><td>{p.sku}</td><td>{p.category?.name}</td><td>${Number(p.price).toFixed(2)}</td><td style={{ fontWeight: 700 }}>{p.currentStock}</td><td>{p.minimumStockLevel}</td><td><span className={`badge ${cls}`}>{status}</span></td><td style={{ fontWeight: 600 }}>${(Number(p.price) * p.currentStock).toLocaleString()}</td></tr>
            );
          })}
        </tbody></table></div>
      </div>
    </div>
  );
}
