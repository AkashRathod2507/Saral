import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

type SidebarProps = {
  onNavigate?: () => void;
};

const sections = [
  {
    label: 'Overview',
    items: [{ path: '/app', label: 'Dashboard' }],
  },
  {
    label: 'Workbench',
    items: [
      { path: '/app/customers', label: 'Customers' },
      { path: '/app/items', label: 'Items' },
      { path: '/app/invoices', label: 'Invoices' },
      { path: '/app/inventory', label: 'Inventory' },
      { path: '/app/billing', label: 'Billing' },
      { path: '/app/transactions', label: 'Transactions' },
      { path: '/app/finance', label: 'Finance Helper' },
      { path: '/app/gst', label: 'GST Filing' },
      { path: '/app/employees', label: 'Employees' },
      { path: '/app/attendance', label: 'Attendance' }
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { pathname } = useLocation();
  const isActive = (to: string) => pathname === to;

  return (
    <div className="h-100">
      <div className="sidebar-brand">
        <div className="sidebar-brand-title">Saral ERP</div>
        <div className="text-muted small">Operator Console</div>
      </div>
      <div className="sidebar-scroll">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            <Nav className="flex-column mb-4">
              {section.items.map((item) => (
                <Nav.Link
                  key={item.path}
                  as={Link}
                  to={item.path}
                  onClick={onNavigate}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
          </div>
        ))}
        <div className="sidebar-divider" />
        <div className="text-muted small">
          Need help? Reach out to finance ops for curated credit lines tailored to your ledger.
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


