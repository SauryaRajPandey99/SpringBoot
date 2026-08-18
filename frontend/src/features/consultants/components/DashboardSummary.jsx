import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FolderOpen,
  RefreshCw,
  Star,
  Upload,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

import { formatDisplayDate, formatShortDate, getMaxCount } from "../../../utils/consultantUtils";

export function DashboardSummary({
  stats,
  loading,
  shortlistCount,
  canExport,
  onRefresh,
  onStatusSelect,
  onTechnologySelect,
  onExperienceSelect,
  onAddConsultant,
  onImportConsultants,
  onViewConsultants,
  onViewShortlist,
  onExportConsultants,
}) {
  const activePercent = getPercent(stats.activeConsultants, stats.totalConsultants);
  const inactivePercent = stats.totalConsultants > 0 ? 100 - activePercent : 0;
  const skillCount = stats.technologyDistribution.length;

  return (
    <section className="dashboard-section" id="dashboard" aria-labelledby="dashboard-title">
      <div className="ops-command-panel">
        <div className="ops-command-copy">
          <p className="eyebrow">Consultant Operations</p>
          <h2 id="dashboard-title">Consultant Operations Hub</h2>
          <span>Live directory snapshot for {formatDisplayDate(stats.today)}</span>
        </div>

        <div className="ops-command-stats" aria-label="Dashboard snapshot">
          <CommandStat icon={<Users size={18} aria-hidden="true" />} label="Directory" value={stats.totalConsultants} />
          <CommandStat icon={<CheckCircle2 size={18} aria-hidden="true" />} label="Active" value={`${activePercent}%`} />
          <CommandStat icon={<Star size={18} aria-hidden="true" />} label="Saved" value={shortlistCount} />
        </div>

        <div className="ops-command-actions">
          <button type="button" className="btn btn-light btn-sm icon-button" onClick={onAddConsultant}>
            <UserPlus size={16} aria-hidden="true" />
            Add
          </button>
          <button type="button" className="btn btn-outline-light btn-sm icon-button" onClick={onImportConsultants}>
            <Upload size={16} aria-hidden="true" />
            Import
          </button>
          <button type="button" className="btn btn-outline-light btn-sm icon-button" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="metric-mosaic" aria-label="Consultant metrics">
        <MetricTile
          tone="blue"
          icon={<Users size={22} aria-hidden="true" />}
          label="Total Consultants"
          value={stats.totalConsultants}
          detail={`${skillCount} skill groups tracked`}
        />
        <MetricTile
          tone="green"
          icon={<CheckCircle2 size={22} aria-hidden="true" />}
          label="Active Bench"
          value={stats.activeConsultants}
          detail={`${activePercent}% available for work`}
        />
        <MetricTile
          tone="amber"
          icon={<CalendarDays size={22} aria-hidden="true" />}
          label="Added Today"
          value={stats.addedToday}
          detail="New records created today"
        />
        <MetricTile
          tone="purple"
          icon={<Activity size={22} aria-hidden="true" />}
          label="Monthly Intake"
          value={stats.newThisMonth}
          detail="Records created this month"
        />
      </div>

      <div className="operations-board">
        <div className="operations-main">
          <SkillCoverageBoard items={stats.technologyDistribution} onTechnologySelect={onTechnologySelect} />
          <ActivityTimeline consultants={stats.recentAdditions} onViewConsultants={onViewConsultants} />
        </div>

        <aside className="operations-rail" aria-label="Dashboard supporting panels">
          <StatusSplitPanel
            active={stats.activeConsultants}
            inactive={stats.inactiveConsultants}
            activePercent={activePercent}
            inactivePercent={inactivePercent}
            onStatusSelect={onStatusSelect}
          />
          <ExperienceLadder items={stats.experienceDistribution} onExperienceSelect={onExperienceSelect} />
          <ActionDock
            shortlistCount={shortlistCount}
            canExport={canExport}
            onViewConsultants={onViewConsultants}
            onViewShortlist={onViewShortlist}
            onExportConsultants={onExportConsultants}
          />
        </aside>
      </div>
    </section>
  );
}

function CommandStat({ icon, label, value }) {
  return (
    <div className="command-stat">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MetricTile({ tone, icon, label, value, detail }) {
  return (
    <article className={`metric-tile tile-${tone}`}>
      <div className="metric-tile-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function SkillCoverageBoard({ items, onTechnologySelect }) {
  const maxCount = getMaxCount(items);

  return (
    <article className="dashboard-card skill-board">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Skill Coverage</p>
          <h2>Technology map</h2>
        </div>
        <span className="panel-count">{items.length} groups</span>
      </div>

      {items.length === 0 && <p className="muted-copy">No technology data yet.</p>}

      {items.length > 0 && (
        <div className="skill-grid">
          {items.map((item, index) => (
            <button
              type="button"
              className="skill-card"
              onClick={() => onTechnologySelect?.(item.label)}
              key={item.label}
              title={`Filter table by ${item.label}`}
            >
              <span>#{index + 1}</span>
              <strong>{item.label}</strong>
              <small>{item.count} consultant{item.count === 1 ? "" : "s"}</small>
              <i aria-hidden="true">
                <span style={{ width: `${Math.max((item.count / maxCount) * 100, 10)}%` }} />
              </i>
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function ActivityTimeline({ consultants, onViewConsultants }) {
  return (
    <article className="dashboard-card activity-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Activity</p>
          <h2>Latest records</h2>
        </div>
        <button type="button" className="text-action" onClick={onViewConsultants}>
          Open directory
        </button>
      </div>

      {consultants.length === 0 && <p className="muted-copy">No consultants added yet.</p>}

      {consultants.length > 0 && (
        <div className="activity-timeline">
          {consultants.map((consultant) => (
            <div className="timeline-item" key={consultant.id}>
              <div className="timeline-marker" aria-hidden="true" />
              <div>
                <strong>{consultant.name}</strong>
                <span>{consultant.technology}</span>
              </div>
              <div className="timeline-meta">
                <span className={`status-badge ${consultant.status.toLowerCase()}`}>
                  {consultant.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
                <time>{formatShortDate(consultant.createdAt)}</time>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function StatusSplitPanel({ active, inactive, activePercent, inactivePercent, onStatusSelect }) {
  return (
    <article className="dashboard-card status-split-card">
      <div className="mini-heading">
        <CheckCircle2 size={18} aria-hidden="true" />
        <h3>Availability split</h3>
      </div>
      <div className="split-meter" aria-label="Active and inactive consultant split">
        <button
          type="button"
          className="split-segment active-segment"
          style={{ width: `${activePercent}%` }}
          onClick={() => onStatusSelect?.("ACTIVE")}
          title="Filter active consultants"
        />
        <button
          type="button"
          className="split-segment inactive-segment"
          style={{ width: `${inactivePercent}%` }}
          onClick={() => onStatusSelect?.("INACTIVE")}
          title="Filter inactive consultants"
        />
      </div>
      <div className="split-summary">
        <SplitItem
          icon={<CheckCircle2 size={16} aria-hidden="true" />}
          label="Active"
          value={active}
          onClick={() => onStatusSelect?.("ACTIVE")}
        />
        <SplitItem
          icon={<XCircle size={16} aria-hidden="true" />}
          label="Inactive"
          value={inactive}
          onClick={() => onStatusSelect?.("INACTIVE")}
        />
      </div>
    </article>
  );
}

function SplitItem({ icon, label, value, onClick }) {
  return (
    <button type="button" className="split-item" onClick={onClick}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function ExperienceLadder({ items, onExperienceSelect }) {
  const maxCount = getMaxCount(items);

  return (
    <article className="dashboard-card ladder-card">
      <div className="mini-heading">
        <Clock3 size={18} aria-hidden="true" />
        <h3>Experience ladder</h3>
      </div>
      <div className="ladder-list">
        {items.length === 0 && <p className="muted-copy">No experience data yet.</p>}
        {items.map((item) => (
          <button
            type="button"
            className="ladder-step"
            onClick={() => onExperienceSelect?.(item.label)}
            key={item.label}
            title={`Filter table by ${item.label}`}
          >
            <span>{item.label}</span>
            <i aria-hidden="true">
              <span style={{ width: `${Math.max((item.count / maxCount) * 100, 8)}%` }} />
            </i>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>
    </article>
  );
}

function ActionDock({ shortlistCount, canExport, onViewConsultants, onViewShortlist, onExportConsultants }) {
  return (
    <article className="dashboard-card action-dock">
      <button type="button" onClick={onViewConsultants}>
        <FolderOpen size={18} aria-hidden="true" />
        Directory
      </button>
      <button type="button" onClick={onViewShortlist}>
        <Star size={18} aria-hidden="true" />
        Shortlist
        <strong>{shortlistCount}</strong>
      </button>
      <button type="button" onClick={onExportConsultants} disabled={!canExport}>
        <Download size={18} aria-hidden="true" />
        Export PDF
      </button>
    </article>
  );
}

function getPercent(value, total) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
