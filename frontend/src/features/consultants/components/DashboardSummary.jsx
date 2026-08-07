import { CheckCircle2, RefreshCw, UserPlus, Users, XCircle } from "lucide-react";

export function DashboardSummary({ stats, loading, onRefresh }) {
  return (
    <>
      <section className="summary-band" id="dashboard" aria-labelledby="dashboard-title">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 id="dashboard-title">Consultant overview</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm icon-button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh from Spring Boot API"
        >
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? "Refreshing" : "Refresh API"}
        </button>
      </section>

      <section className="stats-grid" aria-label="Consultant totals">
        <MetricCard className="metric-blue" icon={<Users size={28} aria-hidden="true" />} label="Total Consultants" value={stats.totalConsultants} />
        <MetricCard className="metric-green" icon={<UserPlus size={28} aria-hidden="true" />} label="New This Month" value={stats.newThisMonth} />
        <MetricCard className="metric-amber" icon={<CheckCircle2 size={28} aria-hidden="true" />} label="Active Consultants" value={stats.activeConsultants} />
        <MetricCard className="metric-red" icon={<XCircle size={28} aria-hidden="true" />} label="Inactive Consultants" value={stats.inactiveConsultants} />
      </section>
    </>
  );
}

function MetricCard({ className, icon, label, value }) {
  return (
    <article className={`metric ${className}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

