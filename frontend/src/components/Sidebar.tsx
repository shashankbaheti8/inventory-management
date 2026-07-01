import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineTruck,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineLogout,
} from 'react-icons/hi';

export default function Sidebar() {
  const { user, logout, isAdmin, isManager } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: HiOutlineHome, to: '/' },
    { label: 'Products', icon: HiOutlineCube, to: '/products' },
    { label: 'Categories', icon: HiOutlineTag, to: '/categories' },
    { label: 'Inventory', icon: HiOutlineClipboardList, to: '/inventory', managerOnly: true },
    { label: 'Suppliers', icon: HiOutlineTruck, to: '/suppliers' },
    { label: 'Purchase Orders', icon: HiOutlineDocumentText, to: '/orders' },
    { label: 'Reports', icon: HiOutlineChartBar, to: '/reports', managerOnly: true },
    { label: 'Users', icon: HiOutlineUsers, to: '/users', adminOnly: true },
    { label: 'Audit Logs', icon: HiOutlineShieldCheck, to: '/audit-logs', adminOnly: true },
    { label: 'Notifications', icon: HiOutlineBell, to: '/notifications' },
  ];

  const filteredItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly && !isManager) return false;
    return true;
  });

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : '??';
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' :
    user?.role === 'INVENTORY_MANAGER' ? 'Inventory Manager' : 'Employee';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📦</div>
        <div>
          <h1>Inventory Pro</h1>
          <span>Enterprise System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Main Menu</div>
        {filteredItems.slice(0, 3).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-label">Operations</div>
        {filteredItems.slice(3, 6).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-label">System</div>
        {filteredItems.slice(6).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}
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
