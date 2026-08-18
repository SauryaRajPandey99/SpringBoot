import { ClipboardCheck, Database, LayoutDashboard, LogOut, ShieldCheck, Star, Upload, UserPlus, Users } from "lucide-react";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "consultants", label: "Consultants", icon: Users },
  { key: "onboarded", label: "Onboarded", icon: ClipboardCheck },
  { key: "shortlist", label: "Shortlist", icon: Star },
  { key: "import", label: "Import", icon: Upload },
  { key: "add", label: "Add Consultant", icon: UserPlus },
];

export function AppHeader({ activeView, userEmail, shortlistCount = 0, collapsed = false, onLogout, onNavigate }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="brand-block">
        <div className="brand-mark">
          <Database size={23} aria-hidden="true" />
        </div>
        <div className="brand-text">
          <p className="eyebrow">Consultant Suite</p>
          <h1>Management System</h1>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              className={activeView === item.key ? "active" : ""}
              onClick={() => onNavigate(item.key)}
              key={item.key}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="nav-label">{item.label}</span>
              {item.key === "shortlist" && shortlistCount > 0 && <span className="nav-count">{shortlistCount}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="signed-in-card">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{userEmail}</span>
        </div>
        <button type="button" className="logout-button" onClick={onLogout} title={`Log out ${userEmail}`}>
          <LogOut size={16} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
