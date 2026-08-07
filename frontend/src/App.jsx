import { useState } from "react";

import { AuthPage } from "./features/auth/AuthPage";
import { ConsultantManagementPage } from "./features/consultants/ConsultantManagementPage";
import { clearSession, getStoredSession, saveSession } from "./utils/authStorage";

function App() {
  const [session, setSession] = useState(() => getStoredSession());

  function handleLogin(nextSession) {
    saveSession(nextSession);
    setSession(nextSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  if (!session?.token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <ConsultantManagementPage session={session} onLogout={handleLogout} />;
}

export default App;

