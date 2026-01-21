import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function ClientasList() {
  const [clientas, setClientas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInactivas, setShowInactivas] = useState(false);
  const [busyIds, setBusyIds] = useState(new Set());
  const [filtroNombre, setFiltroNombre] = useState("");

  const fetchClientas = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await http.get("/clientas");
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

  const clientasFiltradas = useMemo(() => {
    const txt = (filtroNombre || "").trim().toLowerCase();
    if (!txt) return visibleClientas;

    return visibleClientas.filter((c) => {
      const nombre = (c.nombre || "").toString().toLowerCase();
      const apellido = (c.apellido || "").toString().toLowerCase();
      const full = `${nombre} ${apellido}`.trim();
      return full.includes(txt);
    });
  }, [visibleClientas, filtroNombre]);

  const toggleActiva = async (c) => {
    const id = c.id_clienta;
    if (!id) return;

    setBusyIds((prev) => new Set(prev).add(id));

    try {
      const nextActivo = Number(c.activo) === 1 ? 0 : 1;
      await http.put(`/clientas/${id}/activo`, { activo: nextActivo });
      await fetchClientas();
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo cambiar el estado");
    } finally {
      setBusyIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    }
  };

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Clientas</h2>

          <div className="list-header-actions">
            <Link to="/clientas/nueva" className="btn primary">
              Nueva Clienta
            </Link>

            <button type="button" className="btn" onClick={fetchClientas}>
              Recargar
            </button>
          </div>
        </div>

        <div className="filters-card">
          <h3 className="filters-title">Filtros</h3>

          <div className="form-field">
            <label>Buscar por nombre</label>
            <input
              type="text"
              placeholder="Ej: Andrea"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>

          <label className="role-check" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={showInactivas}
              onChange={(e) => setShowInactivas(e.target.checked)}
            />
            Mostrar clientas inactivas
          </label>
        </div>

        {loading && <p>Cargando...</p>}
        {error && <p className="helper-error">{error}</p>}

        {!loading && !error && clientasFiltradas.length === 0 && (
          <p style={{ textAlign: "center", marginTop: 10 }}>
            {filtroNombre.trim()
              ? "No hay resultados para el filtro."
              : showInactivas
              ? "No hay clientas inactivas."
              : "No hay clientas activas."}
          </p>
        )}

        {!loading && !error && clientasFiltradas.length > 0 && (
          <div className={`cards-grid ${clientasFiltradas.length % 2 === 1 ? "odd" : ""}`}>
            {clientasFiltradas.map((c) => {
              const id = c.id_clienta;
              const busy = busyIds.has(id);

              return (
                <div key={id} className="list-item-card">
                  <div className="card-top">
                    <div className="card-title">
                      {c.nombre} {c.apellido}
                    </div>

                    <div className="card-sub">
                      {Number(c.activo) === 1 ? "Activa" : "Inactiva"}
                    </div>
                  </div>

                  <div className="card-mid">
                    <div className="card-line">
                      <span className="muted">Teléfono:</span> {c.telefono || "-"}
                    </div>

                    <div className="card-line">
                      <span className="muted">Email:</span> {c.email || "-"}
                    </div>

                    <div className="card-line">
                      <span className="muted">Dirección:</span> {c.direccion || "-"}
                    </div>
                  </div>

                  <div className="card-actions">
                    <Link to={`/clientas/${id}`} className="btn">
                      Ver Detalle
                    </Link>

                    <Link to={`/clientas/${id}/editar`} className="btn">
                      Editar
                    </Link>

                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => toggleActiva(c)}
                    >
                      {Number(c.activo) === 1 ? "Desactivar" : "Activar"}
                    </button>
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
