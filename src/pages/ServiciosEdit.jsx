import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import http from "../api/http";

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

        // OJO: tu backend puede devolver plano o con wrapper
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

    // Validación mínima (coherente con tu backend)
    if (!form.nombre?.trim()) return setError("Nombre es obligatorio");
    if (!Number.isFinite(form.duracion_min) || form.duracion_min <= 0) return setError("Duración debe ser > 0");
    if (!Number.isFinite(form.precio_base) || form.precio_base <= 0) return setError("Precio debe ser > 0");

    try {
      setSaving(true);

      const payload = {
        nombre: form.nombre.trim(),
        duracion_min: Number(form.duracion_min),
        precio_base: Number(form.precio_base),
        activo: form.activo ? 1 : 0, // si tu backend usa TINYINT
      };

      await http.put(`/servicios/${id}`, payload);

      // volver al detalle (o a la lista)
      navigate(`/servicios/${id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Editar servicio</h1>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <form onSubmit={onSubmit}>
        <div>
          <label>Nombre</label>
          <br />
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            placeholder="Nombre"
          />
        </div>

        <div>
          <label>Duración (minutos)</label>
          <br />
          <input
            type="number"
            name="duracion_min"
            value={form.duracion_min}
            onChange={onChange}
            min={1}
            step={1}
          />
        </div>

        <div>
          <label>Precio</label>
          <br />
          <input
            type="number"
            name="precio_base"
            value={form.precio_base}
            onChange={onChange}
            min={1}
            step={1}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>{" "}
          <Link to={`/servicios/${id}`}>Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
