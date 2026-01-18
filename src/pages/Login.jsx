import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

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
    <div>
      <h1>Köra Skin</h1>
      <hr />

      <h2>Iniciar sesión</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 8 }}>
          <label htmlFor="password">Contraseña</label>
          <br />
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit">Entrar</button>
        </div>
      </form>
    </div>
  );
}
