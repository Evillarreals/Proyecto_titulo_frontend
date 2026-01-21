import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && Number(user.must_change_password) === 0) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!currentPassword || !newPassword || !newPassword2) {
      setError("Debes completar todos los campos");
      return;
    }
    if (newPassword !== newPassword2) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);

      const { data } = await http.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setOk(data?.message || "Contraseña actualizada");

      if (data?.user) {
        setUser(data.user);
      } else if (user) {
        setUser({ ...user, must_change_password: 0 });
      }

      navigate("/", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo actualizar la contraseña";
      setError(msg);

      if (err?.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="form-card">
        <h2 className="form-title">Cambiar contraseña</h2>

        <p style={{ textAlign: "center", marginTop: 0 }}>
          Usuario: <strong>{user?.email || "-"}</strong>
        </p>

        {error && <p className="helper-error">{error}</p>}
        {ok && (
          <p style={{ textAlign: "center", color: "green", fontWeight: 600 }}>
            {ok}
          </p>
        )}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={loading} style={{ border: "none", padding: 0 }}>
            <div className="form-field">
              <label>Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className="form-field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="form-field">
              <label>Repetir nueva contraseña</label>
              <input
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate("/")}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
