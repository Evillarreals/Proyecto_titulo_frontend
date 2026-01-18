import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../auth/AuthContext";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya no debe cambiar contraseña, no tiene sentido quedarse aquí
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

      // ✅ IMPORTANTE: el backend espera camelCase
      const { data } = await http.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });

      setOk(data?.message || "Contraseña actualizada");

      // Actualiza el usuario en contexto (y por AuthContext se persiste en localStorage)
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
    <div>
      <h1>Cambiar contraseña</h1>

      <p>
        Usuario: <strong>{user?.email || "-"}</strong>
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {ok && <p style={{ color: "green" }}>{ok}</p>}

      <form onSubmit={onSubmit}>
        <fieldset disabled={loading}>
          <div>
            <label>Contraseña actual</label>
            <br />
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div>
            <label>Nueva contraseña</label>
            <br />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label>Repetir nueva contraseña</label>
            <br />
            <input
              type="password"
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <br />
          <button type="submit">Guardar</button>{" "}
          <button type="button" onClick={() => navigate("/")}>
            Cancelar
          </button>
        </fieldset>
      </form>
    </div>
  );
}
