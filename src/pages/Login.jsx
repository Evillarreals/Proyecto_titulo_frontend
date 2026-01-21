import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);

      if (data?.must_change_password) {
        navigate("/cambiar-clave", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError("No se pudo iniciar sesión");
      console.error("LOGIN ERROR =>", err?.response?.data || err?.message || err);
    }
  };

 return (
  <div className="login-wrapper">

    <div className="login-card">

      <h2>Iniciar sesión</h2>

      {error && <p className="login-error">{error}</p>}

      <form onSubmit={handleSubmit} className="login-form">

        <div className="login-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-btn">
          Entrar
        </button>

      </form>
    </div>
  </div>
);
}
