import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

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
    <div>
      <h2>Nuevo servicio</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving} style={{ maxWidth: 520 }}>
          <div>
            <label>
              Nombre<br />
              <input name="nombre" value={form.nombre} onChange={onChange} />
            </label>
          </div>

          <div>
            <label>
              Duración (min)<br />
              <input
                name="duracion_min"
                type="number"
                min="1"
                step="1"
                value={form.duracion_min}
                onChange={onChange}
              />
            </label>
          </div>

          <div>
            <label>
              Precio base<br />
              <input
                name="precio_base"
                type="number"
                min="1"
                step="1"
                value={form.precio_base}
                onChange={onChange}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={!canSubmit || saving}>
              {saving ? "Registrando..." : "Registrar servicio"}
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
