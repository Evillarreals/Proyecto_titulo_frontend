import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

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
    return servicios
      .filter((s) => (mostrarInactivos ? Number(s.activo) === 0 : Number(s.activo) === 1));
  }, [servicios, mostrarInactivos]);

  const toggleActivo = async (servicio) => {
    const id = servicio.id_servicio;
    setBusyId(id);
    setError("");

    try {
      if (Number(servicio.activo) === 1) {
        await http.delete(`/servicios/${id}`);
        setServicios((prev) =>
          prev.map((x) => (x.id_servicio === id ? { ...x, activo: 0 } : x))
        );
      } else {
        await http.put(`/servicios/${id}/activar`);
        setServicios((prev) =>
          prev.map((x) => (x.id_servicio === id ? { ...x, activo: 1 } : x))
        );
      }
    } catch (e) {
      setError("No se pudo cambiar el estado del servicio");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1>Servicios</h1>

      <p>
        <Link to="/servicios/nuevo">+ Nuevo servicio</Link>{" "}
        <button type="button" onClick={fetchServicios} disabled={loading}>
          Recargar
        </button>
      </p>

      <fieldset>
        <legend>Filtros</legend>
        <label>
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
          />{" "}
          Mostrar servicios inactivos
        </label>
      </fieldset>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {loading ? (
        <p>Cargando...</p>
      ) : serviciosFiltrados.length === 0 ? (
        <p>{mostrarInactivos ? "No hay servicios inactivos." : "No hay servicios activos."}</p>
      ) : (
        <table border="1" cellPadding="8" cellSpacing="0" width="100%">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Duración (min)</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {serviciosFiltrados.map((s) => (
              <tr key={s.id_servicio}>
                <td>{s.nombre}</td>
                <td>{s.duracion_min}</td>
                <td>${Number(s.precio_base || 0).toLocaleString("es-CL")}</td>
                <td>
                  <Link to={`/servicios/${s.id_servicio}`}>Ver detalle</Link>{" "}
                  | <Link to={`/servicios/${s.id_servicio}/editar`}>Editar</Link>{" "}
                  |{" "}
                  <button
                    type="button"
                    onClick={() => toggleActivo(s)}
                    disabled={busyId === s.id_servicio}
                  >
                    {Number(s.activo) === 1 ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
