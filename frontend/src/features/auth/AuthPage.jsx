import { Lock, LogIn, Mail, UserPlus } from "lucide-react";
import { useState } from "react";

import { authApi } from "../../api/auth";
import { validateAuthForm } from "../../utils/validation";

const emptyCredentials = {
  email: "",
  password: "",
};

export function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState(emptyCredentials);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const isRegistering = mode === "register";

  function updateField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateAuthForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice({ type: "danger", message: "Please correct the highlighted fields." });
      return;
    }

    setLoading(true);
    try {
      const credentials = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };

      if (isRegistering) {
        const response = await authApi.register(credentials);
        setMode("login");
        setValues({ email: response.email || credentials.email, password: "" });
        setNotice({ type: "success", message: response.message || "Account created. Please log in." });
        return;
      }

      const response = await authApi.login(credentials);
      onLogin({ token: response.token, email: response.email });
    } catch (error) {
      setNotice({ type: "danger", message: error.message });
      setErrors(error.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "register" : "login"));
    setValues(emptyCredentials);
    setErrors({});
    setNotice(null);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-brand">
          <p className="eyebrow">Consultant Suite</p>
          <h1>Consultant Management System</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{isRegistering ? "Create Account" : "Secure Login"}</p>
              <h2 id="auth-title">{isRegistering ? "Create Account" : "Login"}</h2>
            </div>
          </div>

          {notice && (
            <div className={`notice notice-${notice.type}`} role="status">
              <span>{notice.message}</span>
            </div>
          )}

          <label className="form-label" htmlFor="auth-email">
            Email
          </label>
          <div className="auth-input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              value={values.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Enter email"
            />
          </div>
          {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}

          <label className="form-label" htmlFor="auth-password">
            Password
          </label>
          <div className="auth-input-wrap">
            <Lock size={17} aria-hidden="true" />
            <input
              id="auth-password"
              type="password"
              autoComplete={isRegistering ? "new-password" : "current-password"}
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={values.password}
              onChange={(event) => updateField("password", event.target.value)}
              placeholder="Enter password"
            />
          </div>
          {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}

          <button type="submit" className="btn btn-success submit-button" disabled={loading}>
            {isRegistering ? <UserPlus size={17} aria-hidden="true" /> : <LogIn size={17} aria-hidden="true" />}
            {loading ? "Please wait" : isRegistering ? "Create Account" : "Login"}
          </button>
        </form>

        <button type="button" className="auth-switch" onClick={switchMode}>
          {isRegistering ? "Already have an account? Login" : "New here? Create account"}
        </button>
      </section>
    </main>
  );
}
