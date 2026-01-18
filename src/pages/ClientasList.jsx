import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

export default function ClientasList() {
  const [clientas, setClientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInactivas, setShowInactivas] = useState(false);
  const [busyIds, setBusyIds] = useState(new Set());

  const fetchClientas = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await http.get("/clientas"); // trae TODAS
      setClientas(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "No se pudieron cargar las clientas");
      setClientas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientas();
  }, []);

  const visibleClientas = useMemo(() => {
    const list = Array.isArray(clientas) ? clientas : [];
    if (showInactivas) return list.filter((c) => Number(c.activo) === 0);
    return list.filter((c) => Number(c.activo) === 1);
  }, [clientas, showInactivas]);

  const toggleActiva = async (c) => {
    const id = c.id_clienta;
    if (!id) return;

    // evita doble click/race conditions
    setBusyIds((prev) => new Set(prev).add(id));
    try {
      const nextActivo = Number(c.activo) === 1 ? 0 : 1;
      await http.put(`/clientas/${id}/activo`, { activo: nextActivo });

      // refresco simple y seguro
      await fetchClientas();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo cambiar el estado de la clienta");
    } finally {
      setBusyIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  return (
    <div>
      <h1>Clientas</h1>

      <div style={{ marginBottom: 8 }}>
        <Link to="/clientas/nueva">+ Nueva clienta</Link>{" "}
        <button type="button" onClick={fetchClientas}>Recargar</button>
      </div>

      <label>
        <input
          type="checkbox"
          checked={showInactivas}
          onChange={(e) => setShowInactivas(e.target.checked)}
        />{" "}
        Mostrar clientas inactivas
      </label>

      <hr />

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && !error && visibleClientas.length === 0 && (
        <p>{showInactivas ? "No hay clientas inactivas." : "No hay clientas activas."}</p>
      )}

      {!loading && !error && visibleClientas.length > 0 && (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Dirección</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleClientas.map((c) => {
              const id = c.id_clienta;
              const busy = busyIds.has(id);

              return (
                <tr key={id}>
                  <td>{c.nombre} {c.apellido}</td>
                  <td>{c.telefono || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td>{c.direccion || "-"}</td>
                  <td>
                    <Link to={`/clientas/${id}`}>Ver detalle</Link>{" "}
                    <Link to={`/clientas/${id}/editar`}>Editar</Link>{" "}
                    <button
                      type="button"
                      onClick={() => toggleActiva(c)}
                      disabled={busy}
                    >
                      {Number(c.activo) === 1 ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
