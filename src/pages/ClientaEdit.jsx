import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

export default function ClientaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/clientas/${id}`);

      // soporta: objeto plano o { clienta: {...} } o { data: {...} }
      const c = res.data?.clienta ?? res.data?.data ?? res.data;

      setForm({
        nombre: c?.nombre ?? "",
        apellido: c?.apellido ?? "",
        telefono: c?.telefono ?? "",
        email: c?.email ?? "",
        direccion: c?.direccion ?? "",
      });
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la clienta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function validate() {
    if (!form.nombre.trim()) return "Nombre es obligatorio";
    if (!form.apellido.trim()) return "Apellido es obligatorio";
    if (!form.telefono.trim()) return "Teléfono es obligatorio";
    if (!form.email.trim()) return "Email es obligatorio";
    if (!form.direccion.trim()) return "Dirección es obligatoria";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }

    try {
      setSaving(true);

      // PUT para actualizar campos editables
      await http.put(`/clientas/${id}`, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim(),
      });

      navigate(`/clientas/${id}`);
    } catch (e2) {
      console.error(e2);
      setErr(e2?.response?.data?.message || "No se pudo actualizar la clienta");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Editar clienta</h1>

      <div style={{ marginBottom: 10 }}>
        <Link to={`/clientas/${id}`}>Volver al detalle</Link>{" "}
        |{" "}
        <button type="button" onClick={fetchOne} disabled={saving}>
          Recargar
        </button>
      </div>

      {err ? <p style={{ color: "crimson" }}>{err}</p> : null}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving}>
          <div>
            <label>Nombre</label>
            <br />
            <input
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
            />
          </div>

          <div>
            <label>Apellido</label>
            <br />
            <input
              value={form.apellido}
              onChange={(e) => setField("apellido", e.target.value)}
            />
          </div>

          <div>
            <label>Teléfono</label>
            <br />
            <input
              value={form.telefono}
              onChange={(e) => setField("telefono", e.target.value)}
            />
          </div>

          <div>
            <label>Email</label>
            <br />
            <input
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
            />
          </div>

          <div>
            <label>Dirección</label>
            <br />
            <input
              value={form.direccion}
              onChange={(e) => setField("direccion", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="submit">{saving ? "Guardando..." : "Guardar cambios"}</button>{" "}
            <button type="button" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
