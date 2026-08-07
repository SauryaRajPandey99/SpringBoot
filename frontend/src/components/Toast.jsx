import { Database } from "lucide-react";

export function Toast({ notice }) {
  if (!notice?.message) {
    return null;
  }

  return (
    <div className={`toast-message notice-${notice.type}`} role="status">
      <Database size={16} aria-hidden="true" />
      <span>{notice.message}</span>
    </div>
  );
}

