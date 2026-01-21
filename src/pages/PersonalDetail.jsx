import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import "../App.css";

function rolesToList(personal) {
  const r = personal?.roles;

  if (Array.isArray(r)) {
    if (r.length === 0) return [];
    if (typeof r[0] === "string") return r.filter(Boolean);
    if (typeof r[0] === "object" && r[0] !== null) {
      return r.map((x) => x.nombre ?? x.role ?? x.name).filter(Boolean);
    }
  }

  const single =
    (typeof personal?.rol === "string" && personal.rol) ||
    (typeof personal?.rol_nombre === "string" && personal.rol_nombre) ||
    (typeof personal?.role_name === "string" && personal.role_name);

  return single ? [single] : [];
}

export default function PersonalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/personal/${id}`);
      const payload = (res.data?.personal ?? res.data?.data ?? res.data) || null;
      setData(payload);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle del personal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
  }, [id]);

  const roles = useMemo(() => rolesToList(data), [data]);

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

  if (!data) {
    return (
      <div className="page-center">
        <div className="form-card">
          <h2 className="form-title">Detalle personal</h2>
          <p style={{ textAlign: "center" }}>No existe el registro.</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const nombre = `${data.nombre ?? ""} ${data.apellido ?? ""}`.trim() || "-";
  const activoTxt =
    "activo" in data ? (Number(data.activo) === 1 ? "Activo" : "Inactivo") : "-";

  return (
    <div className="page-center">
      <div className="list-card">

        <div className="list-header">
          <h2 className="list-title">Detalle personal</h2>

          <div className="list-header-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>

            <Link to="/personal" className="btn">
              Ir al listado
            </Link>

            <Link to={`/personal/${id}/editar`} className="btn">
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
            <div className="card-sub">
              <span className={`chip ${activoTxt === "Activo" ? "ok" : "danger"}`}>
                {activoTxt}
              </span>
            </div>
          </div>

          <div className="card-mid" style={{ justifyContent: "flex-start" }}>
            <div className="card-line">
              <span className="muted">RUT:</span> {data.rut ?? "-"}
            </div>

            <div className="card-line">
              <span className="muted">Email:</span> {data.email ?? "-"}
            </div>

            <div className="card-line">
              <span className="muted">Teléfono:</span> {data.telefono ?? "-"}
            </div>

            <div className="card-line">
              <span className="muted">Dirección:</span> {data.direccion ?? "-"}
            </div>
          </div>
        </div>

        <div className="filters-card" style={{ marginTop: 14 }}>
          <h3 className="filters-title">Roles</h3>

          {roles.length === 0 ? (
            <p style={{ textAlign: "center" }}>-</p>
          ) : (
            <div className={`cards-grid ${roles.length % 2 === 1 ? "odd" : ""}`}>
              {roles.map((r) => (
                <div key={r} className="list-item-card" style={{ padding: 12 }}>
                  <div className="card-top" style={{ marginBottom: 0 }}>
                    <div className="card-title" style={{ fontSize: 15 }}>
                      {r}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
