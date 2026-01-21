import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

function rolesToText(p) {
  const r = p?.roles;

  if (Array.isArray(r)) {
    if (r.length === 0) return "-";
    if (typeof r[0] === "string") return r.join(", ");
    if (typeof r[0] === "object" && r[0] !== null) {
      return r
        .map((x) => x.nombre ?? x.role ?? x.name)
        .filter(Boolean)
        .join(", ") || "-";
    }
  }

  if (typeof p?.rol === "string") return p.rol;
  if (typeof p?.rol_nombre === "string") return p.rol_nombre;
  if (typeof p?.role_name === "string") return p.role_name;

  return "-";
}

export default function PersonalList() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [showInactivos, setShowInactivos] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/personal");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el listado de personal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function toggleActivo(p) {
    const id = p.id_personal ?? p.id ?? p.idPersonal;
    if (!id) return;

    try {
      if (Number(p.activo) === 1) {
        await http.delete(`/personal/${id}`);
      } else {
        await http.put(`/personal/${id}/activar`);
      }

      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado del personal");
    }
  }

  const filteredSorted = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];

    const targetActivo = showInactivos ? 0 : 1;
    const filtered = arr.filter((p) => Number(p.activo) === targetActivo);

    filtered.sort((a, b) => {
      const aApe = (a.apellido ?? "").toString().toLowerCase();
      const bApe = (b.apellido ?? "").toString().toLowerCase();
      if (aApe !== bApe) return aApe.localeCompare(bApe);
      const aNom = (a.nombre ?? "").toString().toLowerCase();
      const bNom = (b.nombre ?? "").toString().toLowerCase();
      return aNom.localeCompare(bNom);
    });

    return filtered;
  }, [items, showInactivos]);

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

  return (
    <div className="page-center">
      <div className="list-card">

        <div className="list-header">
          <h2 className="list-title">Personal</h2>

          <div className="list-header-actions">
            <Link to="/personal/nueva" className="btn primary">
              Nuevo Personal
            </Link>

            <button type="button" className="btn" onClick={fetchAll}>
              Recargar
            </button>

            <Link to="/dashboard" className="btn">
              Volver
            </Link>
          </div>
        </div>

        <div className="filters-card">
          <label className="role-check">
            <input
              type="checkbox"
              checked={showInactivos}
              onChange={(e) => setShowInactivos(e.target.checked)}
            />
            Mostrar personal inactivo
          </label>
        </div>

        {filteredSorted.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 10 }}>
            {showInactivos ? "No hay personal inactivo." : "No hay personal activo."}
          </p>
        ) : (
          <div
            className={`cards-grid ${filteredSorted.length % 2 === 1 ? "odd" : ""}`}
            style={{ marginTop: 14 }}
          >
            {filteredSorted.map((p) => {
              const id = p.id_personal ?? p.id ?? p.idPersonal;
              const nombre = `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim() || "-";
              const activoTxt = Number(p.activo) === 1 ? "Activo" : "Inactivo";
              const rolesTxt = rolesToText(p);

              return (
                <div key={id ?? `${p.email}-${nombre}`} className="list-item-card">
                  <div className="card-top">
                    <div className="card-title">{nombre}</div>
                    <div className="card-sub">{activoTxt}</div>
                  </div>

                  <div className="card-mid" style={{ justifyContent: "flex-start" }}>
                    <div className="card-line">
                      <span className="muted">RUT:</span> {p.rut ?? "-"}
                    </div>

                    <div className="card-line">
                      <span className="muted">Email:</span> {p.email ?? "-"}
                    </div>

                    <div className="card-line">
                      <span className="muted">Teléfono:</span> {p.telefono ?? "-"}
                    </div>

                    <div className="card-line">
                      <span className="muted">Roles:</span> {rolesTxt}
                    </div>
                  </div>

                  <div className="card-actions">
                    {id ? (
                      <>
                        <Link to={`/personal/${id}`} className="btn">
                          Ver Detalle
                        </Link>

                        <Link to={`/personal/${id}/editar`} className="btn">
                          Editar
                        </Link>

                        <button type="button" className="btn" onClick={() => toggleActivo(p)}>
                          {Number(p.activo) === 1 ? "Desactivar" : "Activar"}
                        </button>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
