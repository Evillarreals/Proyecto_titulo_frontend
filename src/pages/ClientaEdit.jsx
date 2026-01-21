import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import "../App.css";

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
      const c = res.data?.clienta ?? res.data?.data ?? res.data;

      setForm({
        nombre: c?.nombre ?? "",
        apellido: c?.apellido ?? "",
        telefono: c?.telefono ?? "",
        email: c?.email ?? "",
        direccion: c?.direccion ?? "",
      });
    } catch (e) {
      setErr("No se pudo cargar la clienta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
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

      await http.put(`/clientas/${id}`, {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim(),
      });

      navigate(`/clientas/${id}`);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "No se pudo actualizar la clienta");
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

        <h2 className="form-title">Editar clienta</h2>

        <div className="form-actions"style={{marginBottom: 20}}>
          <Link
            to={`/clientas/${id}`}
            className="btn"
          >
            Volver al detalle
          </Link>

          <button
            type="button"
            className="btn"
            onClick={fetchOne}
            disabled={saving}
          >
            Recargar
          </button>
        </div>

        {err && <p className="helper-error">{err}</p>}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={saving} style={{ border: "none", padding: 0 }}>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Apellido</label>
                <input
                  value={form.apellido}
                  onChange={(e) => setField("apellido", e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => setField("telefono", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Dirección</label>
              <input
                value={form.direccion}
                onChange={(e) => setField("direccion", e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>

          </fieldset>
        </form>
      </div>
    </div>
  );
}
