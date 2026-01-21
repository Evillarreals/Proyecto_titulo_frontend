import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function ServicioForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    duracion_min: "",
    precio_base: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const nombreOk = form.nombre.trim().length > 0;
    const durOk = Number(form.duracion_min) > 0;
    const precioOk = Number(form.precio_base) > 0;
    return nombreOk && durOk && precioOk;
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Completa: nombre, duración (min) y precio base (ambos > 0).");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      duracion_min: Number(form.duracion_min),
      precio_base: Number(form.precio_base),
    };

    try {
      setSaving(true);
      await http.post("/servicios", payload);
      navigate("/servicios");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo registrar el servicio";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-center">
      <div className="form-card">
        <h2 className="form-title">Nuevo servicio</h2>

        {error && <p className="helper-error">{error}</p>}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={saving} style={{ border: "none", padding: 0 }}>
            <div className="form-field">
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={onChange} />
            </div>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Duración (min)</label>
                <input
                  name="duracion_min"
                  type="number"
                  min="1"
                  step="1"
                  value={form.duracion_min}
                  onChange={onChange}
                />
              </div>

              <div className="form-field">
                <label>Precio base</label>
                <input
                  name="precio_base"
                  type="number"
                  min="1"
                  step="1"
                  value={form.precio_base}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={!canSubmit || saving}>
                {saving ? "Registrando..." : "Registrar servicio"}
              </button>

              <button type="button" className="btn" onClick={() => navigate(-1)} disabled={saving}>
                Volver
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
