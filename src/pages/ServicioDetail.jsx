import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import "../App.css";

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `$${n.toFixed(0)}`;
}

export default function ServicioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [raw, setRaw] = useState(null);

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/servicios/${id}`);
      setRaw(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle del servicio");
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
  }, [id]);

  const servicio = useMemo(() => {
    if (!raw) return null;
    if (raw.servicio && typeof raw.servicio === "object") return raw.servicio;
    if (raw.data && typeof raw.data === "object") return raw.data;
    return raw;
  }, [raw]);

  if (loading) {
    return (
      <div className="page-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page-center">
        <p className="helper-error">{err}</p>
      </div>
    );
  }

  if (!servicio) {
    return (
      <div className="page-center">
        <div className="form-card">
          <h2 className="form-title">Detalle servicio</h2>
          <p style={{ textAlign: "center" }}>No existe el servicio.</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nombre = servicio.nombre ?? "-";
  const dur =
    servicio.duracion_minutos ?? servicio.duracion_min ?? servicio.duracion ?? "-";
  const precio = servicio.precio ?? servicio.precio_base ?? "-";

  const activoTxt =
    "activo" in servicio ? (Number(servicio.activo) === 1 ? "Activo" : "Inactivo") : null;

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Detalle servicio</h2>

          <div className="list-header-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>

            <Link to="/servicios" className="btn">
              Ir al listado
            </Link>

            <Link to={`/servicios/${id}/editar`} className="btn">
              Editar
            </Link>

            <button type="button" className="btn" onClick={fetchOne}>
              Recargar
            </button>
          </div>
        </div>

        <div className="resume-box" style={{ marginTop: 14 }}>
          <div className="card-top" style={{ marginBottom: 10 }}>
            <div className="card-title">{nombre}</div>

            {activoTxt ? (
              <div className="card-sub">
                <span className={`chip ${activoTxt === "Activo" ? "ok" : "danger"}`}>
                  {activoTxt}
                </span>
              </div>
            ) : null}
          </div>

          <div className="card-mid" style={{ justifyContent: "flex-start" }}>
            <div className="card-line">
              <span className="muted">Duración:</span> <strong>{dur}</strong> min
            </div>

            <div className="card-line">
              <span className="muted">Precio:</span>{" "}
              <strong>{precio !== "-" ? moneyCLP(precio) : "-"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
