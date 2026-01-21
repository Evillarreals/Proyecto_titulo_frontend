import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function ClientaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [raw, setRaw] = useState(null);

  async function fetchDetail() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/clientas/${id}`);
      setRaw(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle de la clienta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const clienta = useMemo(() => {
    if (!raw) return null;
    if (raw.clienta && typeof raw.clienta === "object") return raw.clienta;
    return raw;
  }, [raw]);

  const nombreCompleto = useMemo(() => {
    if (!clienta) return "";
    return `${clienta.nombre ?? ""} ${clienta.apellido ?? ""}`.trim();
  }, [clienta]);

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

  if (!clienta) {
    return (
      <div className="page-center">
        <div className="form-card">
          <h2 className="form-title">Detalle clienta</h2>
          <p style={{ textAlign: "center" }}>No existe la clienta.</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activaTxt =
    "activo" in clienta ? (Number(clienta.activo) === 1 ? "Activa" : "Inactiva") : null;

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Detalle clienta</h2>

          <div className="list-header-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>

            <Link to="/clientas" className="btn">
              Ir al listado
            </Link>

            <Link to={`/clientas/${id}/editar`} className="btn">
              Editar
            </Link>

            <button type="button" className="btn" onClick={fetchDetail}>
              Recargar
            </button>
          </div>
        </div>

        <div className="resume-box" style={{ marginTop: 14 }}>
          <div className="card-top" style={{ marginBottom: 10 }}>
            <div className="card-title">{nombreCompleto || "-"}</div>
            {activaTxt ? (
              <div className="card-sub">
                <span className={`chip ${activaTxt === "Activa" ? "ok" : "danger"}`}>
                  {activaTxt}
                </span>
              </div>
            ) : null}
          </div>

          <div className="card-mid" style={{ justifyContent: "flex-start" }}>
            <div className="card-line">
              <span className="muted">Email:</span> {clienta.email || "-"}
            </div>

            <div className="card-line">
              <span className="muted">Teléfono:</span> {clienta.telefono || "-"}
            </div>

            <div className="card-line">
              <span className="muted">Dirección:</span> {clienta.direccion || "-"}
            </div>
          </div>
        </div>

        <div className="filters-card" style={{ marginTop: 14 }}>
          <h3 className="filters-title">Acciones rápidas</h3>

          <div className="form-actions" style={{ justifyContent: "center" }}>
            <Link to="/ventas/nueva" className="btn primary">
              Registrar venta
            </Link>

            <Link to="/atenciones/nueva" className="btn primary">
              Agendar atención
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
