import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

export default function ClientaForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      form.nombre.trim().length > 0 &&
      form.apellido.trim().length > 0 &&
      form.telefono.trim().length > 0
    );
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Completa al menos: nombre, apellido y teléfono.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim() || null,
      direccion: form.direccion.trim() || null,
    };

    try {
      setSaving(true);
      await http.post("/clientas", payload);
      navigate("/clientas");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo registrar la clienta";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Nueva clienta</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving} style={{ maxWidth: 520 }}>
          <div>
            <label>
              Nombre<br />
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                autoComplete="given-name"
              />
            </label>
          </div>

          <div>
            <label>
              Apellido<br />
              <input
                name="apellido"
                value={form.apellido}
                onChange={onChange}
                autoComplete="family-name"
              />
            </label>
          </div>

          <div>
            <label>
              Teléfono<br />
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
                autoComplete="tel"
              />
            </label>
          </div>

          <div>
            <label>
              Email (opcional)<br />
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                autoComplete="email"
              />
            </label>
          </div>

          <div>
            <label>
              Dirección (opcional)<br />
              <input
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                autoComplete="street-address"
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={!canSubmit || saving}>
              {saving ? "Registrando..." : "Registrar clienta"}
            </button>{" "}
            <button type="button" onClick={() => navigate(-1)} disabled={saving}>
              Volver
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
