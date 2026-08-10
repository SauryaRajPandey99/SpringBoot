import { Database, LayoutDashboard, LogOut, ShieldCheck, Upload, UserPlus, Users } from "lucide-react";

export function AppHeader({ userEmail, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <Database size={23} aria-hidden="true" />
        </div>
        <div>
          <p className="eyebrow">Consultant Suite</p>
          <h1>Management System</h1>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        <button type="button" onClick={() => document.getElementById("dashboard")?.scrollIntoView()}>
          <LayoutDashboard size={18} aria-hidden="true" />
          Dashboard
        </button>
        <button type="button" onClick={() => document.getElementById("consultants")?.scrollIntoView()}>
          <Users size={18} aria-hidden="true" />
          Consultants
        </button>
        <button type="button" onClick={() => document.getElementById("import")?.scrollIntoView()}>
          <Upload size={18} aria-hidden="true" />
          Import
        </button>
        <button type="button" onClick={() => document.getElementById("consultant-form")?.scrollIntoView()}>
          <UserPlus size={18} aria-hidden="true" />
          Add Consultant
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="signed-in-card">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{userEmail}</span>
        </div>
        <button type="button" className="logout-button" onClick={onLogout} title={`Log out ${userEmail}`}>
          <LogOut size={16} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}
