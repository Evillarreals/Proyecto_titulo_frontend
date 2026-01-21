import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function ServiciosEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    duracion_min: 0,
    precio_base: 0,
    activo: true,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const { data } = await http.get(`/servicios/${id}`);
        const srv = data?.servicio ?? data;

        if (!srv) throw new Error("No se encontró el servicio");

        if (!mounted) return;

        setForm({
          nombre: srv.nombre ?? "",
          duracion_min: Number(srv.duracion_min ?? 0),
          precio_base: Number(srv.precio_base ?? 0),
          activo: srv.activo === 0 ? false : true,
        });
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || e?.message || "Error al cargar servicio");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  function onChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "duracion_min" || name === "precio_base"
          ? value === "" ? "" : Number(value)
          : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.nombre?.trim()) return setError("Nombre es obligatorio");
    if (!Number.isFinite(form.duracion_min) || form.duracion_min <= 0)
      return setError("Duración debe ser mayor a 0");
    if (!Number.isFinite(form.precio_base) || form.precio_base <= 0)
      return setError("Precio debe ser mayor a 0");

    try {
      setSaving(true);

      const payload = {
        nombre: form.nombre.trim(),
        duracion_min: Number(form.duracion_min),
        precio_base: Number(form.precio_base),
        activo: form.activo ? 1 : 0,
      };

      await http.put(`/servicios/${id}`, payload);

      navigate(`/servicios/${id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="form-card">
        <h2 className="form-title">Editar servicio</h2>

        <div className="form-actions" style={{ marginBottom: 18 }}>
          <Link to={`/servicios/${id}`} className="btn">
            Volver al detalle
          </Link>
        </div>

        {error && <p className="helper-error">{error}</p>}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={saving} style={{ border: "none", padding: 0 }}>
            <div className="form-field">
              <label>Nombre</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={onChange}
                placeholder="Nombre del servicio"
              />
            </div>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Duración (min)</label>
                <input
                  type="number"
                  name="duracion_min"
                  value={form.duracion_min}
                  onChange={onChange}
                  min={1}
                  step={1}
                />
              </div>

              <div className="form-field">
                <label>Precio base</label>
                <input
                  type="number"
                  name="precio_base"
                  value={form.precio_base}
                  onChange={onChange}
                  min={1}
                  step={1}
                />
              </div>
            </div>

            <div className="form-checkbox">
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={onChange}
              />
              <label>Servicio activo</label>
            </div>


            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <Link to={`/servicios/${id}`} className="btn">
                Cancelar
              </Link>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
