import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout } from 'react-icons/hi';

export default function Sidebar() {
  const { user, logout, isAdmin, isManager, unreadCount } = useAuth();

  const navItems = [
    { label: 'Dashboard', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'Categories', to: '/categories' },
    { label: 'Inventory', to: '/inventory', managerOnly: true },
    { label: 'Suppliers', to: '/suppliers' },
    { label: 'Purchase Orders', to: '/orders' },
    { label: 'Reports', to: '/reports', managerOnly: true },
    { label: 'Users', to: '/users', adminOnly: true },
    { label: 'Audit Logs', to: '/audit-logs', adminOnly: true },
    { label: 'Notifications', to: '/notifications', badge: unreadCount },
  ];

  const menuGroups = [
    {
      label: 'Main Menu',
      items: navItems.slice(0, 3).filter(item => (!item.adminOnly || isAdmin) && (!item.managerOnly || isManager)),
    },
    {
      label: 'Operations',
      items: navItems.slice(3, 7).filter(item => (!item.adminOnly || isAdmin) && (!item.managerOnly || isManager)),
    },
    {
      label: 'System',
      items: navItems.slice(7).filter(item => (!item.adminOnly || isAdmin) && (!item.managerOnly || isManager)),
    },
  ];

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' :
    user?.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Employee';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div>
          <h1>Inventory Pro</h1>
          <span>Enterprise System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          if (group.items.length === 0) return null;
          return (
            <div key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  end={item.to === '/'}
                >
                  {item.label}
                  {item.badge ? <span className="badge badge-danger" style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: 10 }}>{item.badge > 99 ? '99+' : item.badge}</span> : null}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
          <div className="sidebar-user-role">{roleLabel}</div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">
          <HiOutlineLogout size={18} />
        </button>
      </div>
    </aside>
  );
}
