import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import "../App.css";

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
    <div className="page-center">

      <div className="form-card">

        <h2 className="form-title">Nueva clienta</h2>

        {error && <p className="helper-error">{error}</p>}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={saving} style={{ border: "none", padding: 0 }}>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  autoComplete="given-name"
                />
              </div>

              <div className="form-field">
                <label>Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={onChange}
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={onChange}
                autoComplete="tel"
              />
            </div>

            <div className="form-field">
              <label>Email (opcional)</label>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                autoComplete="email"
              />
            </div>

            <div className="form-field">
              <label>Dirección (opcional)</label>
              <input
                name="direccion"
                value={form.direccion}
                onChange={onChange}
                autoComplete="street-address"
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={!canSubmit || saving}
              >
                {saving ? "Registrando..." : "Registrar clienta"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Volver
              </button>
            </div>

          </fieldset>
        </form>
      </div>
    </div>
  );
}
