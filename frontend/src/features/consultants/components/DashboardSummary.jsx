import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { formatDisplayDate, formatShortDate, getMaxCount } from "../../../utils/consultantUtils";

export function DashboardSummary({ stats, loading, onRefresh }) {
  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2 id="dashboard-title">Workforce overview</h2>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary btn-sm icon-button"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh dashboard data"
        >
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="metrics-grid" aria-label="Consultant totals">
        <MetricCard
          className="metric-date"
          icon={<CalendarDays size={25} aria-hidden="true" />}
          label="Today"
          value={formatDisplayDate(stats.today)}
        />
        <MetricCard
          className="metric-total"
          icon={<Users size={25} aria-hidden="true" />}
          label="Total Consultants"
          value={stats.totalConsultants}
        />
        <MetricCard
          className="metric-added"
          icon={<UserPlus size={25} aria-hidden="true" />}
          label="Added Today"
          value={stats.addedToday}
        />
        <MetricCard
          className="metric-active"
          icon={<CheckCircle2 size={25} aria-hidden="true" />}
          label="Active"
          value={stats.activeConsultants}
        />
        <MetricCard
          className="metric-inactive"
          icon={<XCircle size={25} aria-hidden="true" />}
          label="Inactive"
          value={stats.inactiveConsultants}
        />
      </div>

      <div className="analytics-grid">
        <DistributionPanel
          title="Technology Distribution"
          icon={<Activity size={18} aria-hidden="true" />}
          items={stats.technologyDistribution}
          emptyLabel="No technology data yet."
        />
        <DistributionPanel
          title="Experience Distribution"
          icon={<Clock3 size={18} aria-hidden="true" />}
          items={stats.experienceDistribution}
          emptyLabel="No experience data yet."
        />
        <RecentAdditions consultants={stats.recentAdditions} />
      </div>
    </section>
  );
}

function MetricCard({ className, icon, label, value }) {
  return (
    <article className={`metric-card ${className}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function DistributionPanel({ title, icon, items, emptyLabel }) {
  const maxCount = getMaxCount(items);

  return (
    <article className="analytics-panel">
      <div className="mini-heading">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="bar-list">
        {items.length === 0 && <p className="muted-copy">{emptyLabel}</p>}
        {items.map((item) => (
          <div className="bar-row" key={item.label}>
            <div className="bar-row-meta">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <span style={{ width: `${Math.max((item.count / maxCount) * 100, 6)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function RecentAdditions({ consultants }) {
  return (
    <article className="analytics-panel recent-panel">
      <div className="mini-heading">
        <UserPlus size={18} aria-hidden="true" />
        <h3>Recent Additions</h3>
      </div>
      <div className="recent-list">
        {consultants.length === 0 && <p className="muted-copy">No consultants added yet.</p>}
        {consultants.map((consultant) => (
          <div className="recent-item" key={consultant.id}>
            <div>
              <strong>{consultant.name}</strong>
              <span>{consultant.technology}</span>
            </div>
            <time>{formatShortDate(consultant.createdAt)}</time>
          </div>
        ))}
      </div>
    </article>
  );
}
