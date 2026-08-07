import { LogOut } from "lucide-react";

// Scrolls to a section, then plays a short highlight animation directly via JS (no CSS needed)
function scrollAndAnimate(sectionId, targetSelector, keyframes, options) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  section.scrollIntoView({ behavior: "smooth", block: "start" });

  window.setTimeout(() => {
    const target = targetSelector ? section.querySelector(targetSelector) : section;
    if (!target) return;

    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      target.focus();
    }

    target.animate(keyframes, options);
  }, 400);
}

const blinkKeyframes = [
  { boxShadow: "0 0 0 0 rgba(59,130,246,0)", backgroundColor: "transparent" },
  { boxShadow: "0 0 0 4px rgba(59,130,246,0.4)", backgroundColor: "rgba(59,130,246,0.1)" },
  { boxShadow: "0 0 0 0 rgba(59,130,246,0)", backgroundColor: "transparent" },
];

const typingKeyframes = [
  { borderColor: "rgba(59,130,246,0)", boxShadow: "0 0 0 0 rgba(59,130,246,0)" },
  { borderColor: "rgba(59,130,246,1)", boxShadow: "0 0 0 2px rgba(59,130,246,0.25)" },
  { borderColor: "rgba(59,130,246,0)", boxShadow: "0 0 0 0 rgba(59,130,246,0)" },
];

const animOptions = { duration: 900, iterations: 1, easing: "ease-in-out" };

export function AppHeader({ userEmail, onLogout }) {
  return (
      <header className="topbar">
        <div>
          <p className="eyebrow">Java Web Project</p>
          <h1>Consultant Management System</h1>
        </div>
        <nav aria-label="Primary navigation">
          <button type="button" onClick={() => document.getElementById("dashboard")?.scrollIntoView({ behavior: "smooth" })}>
            Dashboard
          </button>
          <button
              type="button"
              onClick={() =>
                  scrollAndAnimate(
                      "consultants",
                      "input[type='search'], input[name='search']",
                      blinkKeyframes,
                      animOptions
                  )
              }
          >
            Consultants
          </button>
          <button
              type="button"
              onClick={() =>
                  scrollAndAnimate("consultant-form", "input, textarea", typingKeyframes, animOptions)
              }
          >
            Add Consultant
          </button>
          <button type="button" className="logout-button" onClick={onLogout} title={`Log out ${userEmail}`}>
            <LogOut size={16} aria-hidden="true" />
            Logout
          </button>
        </nav>
      </header>
  );
}