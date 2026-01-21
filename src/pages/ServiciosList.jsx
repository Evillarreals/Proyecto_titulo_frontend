import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function ServiciosList() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const fetchServicios = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await http.get("/servicios");
      setServicios(Array.isArray(data) ? data : []);
    } catch (e) {
      setError("No se pudieron cargar los servicios");
      setServicios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((s) =>
      mostrarInactivos ? Number(s.activo) === 0 : Number(s.activo) === 1
    );
  }, [servicios, mostrarInactivos]);

  const toggleActivo = async (servicio) => {
    const id = servicio.id_servicio;
    setBusyId(id);
    setError("");

    try {
      if (Number(servicio.activo) === 1) {
        await http.delete(`/servicios/${id}`);
        setServicios((prev) =>
          prev.map((x) =>
            x.id_servicio === id ? { ...x, activo: 0 } : x
          )
        );
      } else {
        await http.put(`/servicios/${id}/activar`);
        setServicios((prev) =>
          prev.map((x) =>
            x.id_servicio === id ? { ...x, activo: 1 } : x
          )
        );
      }
    } catch (e) {
      setError("No se pudo cambiar el estado del servicio");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="page-center">
      <div className="list-card">

        <div className="list-header">
          <h2 className="list-title">Servicios</h2>

          <div className="list-header-actions">
            <Link to="/servicios/nuevo" className="btn primary">
              Nuevo Servicio
            </Link>

            <button
              type="button"
              className="btn"
              onClick={fetchServicios}
              disabled={loading}
            >
              Recargar
            </button>
          </div>
        </div>

        <div className="filters-card">
          <label className="role-check">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar servicios inactivos
          </label>
        </div>

        {error && <p className="helper-error">{error}</p>}

        {loading ? (
          <p>Cargando...</p>
        ) : serviciosFiltrados.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 10 }}>
            {mostrarInactivos
              ? "No hay servicios inactivos."
              : "No hay servicios activos."}
          </p>
        ) : (
          <div
            className={`cards-grid ${
              serviciosFiltrados.length % 2 === 1 ? "odd" : ""
            }`}
          >
            {serviciosFiltrados.map((s) => (
              <div key={s.id_servicio} className="list-item-card">
                <div className="card-top">
                  <div className="card-title">{s.nombre}</div>
                  <div className="card-sub">
                    {Number(s.activo) === 1 ? "Activo" : "Inactivo"}
                  </div>
                </div>

                <div className="card-mid">
                  <div className="card-line">
                    <span className="muted">Duración:</span>{" "}
                    {s.duracion_min} min
                  </div>

                  <div className="card-line">
                    <span className="muted">Precio:</span>{" "}
                    <strong>
                      ${Number(s.precio_base || 0).toLocaleString("es-CL")}
                    </strong>
                  </div>
                </div>

                <div className="card-actions">
                  <Link to={`/servicios/${s.id_servicio}`} className="btn">
                    Ver Detalle
                  </Link>

                  <Link
                    to={`/servicios/${s.id_servicio}/editar`}
                    className="btn"
                  >
                    Editar
                  </Link>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => toggleActivo(s)}
                    disabled={busyId === s.id_servicio}
                  >
                    {Number(s.activo) === 1 ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
