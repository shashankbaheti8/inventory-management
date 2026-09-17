import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatCurrency } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then(({ data: res }) => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><h3>Failed to load dashboard</h3></div>;

  const stats = [
    { label: 'Total Products', value: data.stats.totalProducts },
    { label: 'Categories', value: data.stats.totalCategories },
    { label: 'Suppliers', value: data.stats.totalSuppliers },
    { label: 'Active Orders', value: data.stats.activeOrders },
    { label: 'Low Stock Items', value: data.stats.lowStockCount },
    { label: 'Inventory Value', value: formatCurrency(data.stats.totalInventoryValue) },
  ];

  return (
    <div className="fade-in">
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card slide-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-header"><h3 className="card-title">Recent Transactions</h3></div>
        {data.recentTransactions.length === 0 ? <div className="empty-state"><p>No transactions yet</p></div> : (
          <div className="table-container"><table className="data-table"><thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>By</th></tr></thead><tbody>
            {data.recentTransactions.map((t: any) => (
              <tr key={t.id}><td style={{color:'var(--text-primary)',fontWeight:500}}>{t.product.name}</td><td><span className="badge badge-info">{t.transactionType.replace('_',' ')}</span></td><td style={{fontWeight:600}}>{t.quantity}</td><td>{t.createdBy.firstName} {t.createdBy.lastName}</td></tr>
            ))}
          </tbody></table></div>
        )}
      </div>
    </div>
  );
}
