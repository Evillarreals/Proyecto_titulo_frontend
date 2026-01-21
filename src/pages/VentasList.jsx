import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

function formatDateTime(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "$0";
  return `$${n.toFixed(0)}`;
}

function isPagoPagado(estadoPago) {
  const s = String(estadoPago ?? "").trim().toLowerCase();
  return s.startsWith("pagad");
}

function startOfDayLocal(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}
function endOfDayLocal(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

export default function VentasList() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [showPagadas, setShowPagadas] = useState(false);
  const [qClienta, setQClienta] = useState("");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/ventas");
      const list = res.data?.ventas ?? res.data?.data ?? res.data;
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el listado de ventas");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    let arr = [...items];

    arr = arr.filter((v) =>
      showPagadas ? isPagoPagado(v.estado_pago) : !isPagoPagado(v.estado_pago)
    );

    const q = qClienta.trim().toLowerCase();
    if (q) {
      arr = arr.filter((v) => {
        const nombre = String(v.clienta_nombre ?? "").toLowerCase();
        const apellido = String(v.clienta_apellido ?? "").toLowerCase();
        const full = `${nombre} ${apellido}`.trim();
        return full.includes(q);
      });
    }

    const fromMs = startOfDayLocal(dateFrom);
    const toMs = endOfDayLocal(dateTo);
    if (fromMs || toMs) {
      arr = arr.filter((v) => {
        const fechaIso = v.fecha ?? v.fecha_venta ?? v.created_at ?? null;
        const t = fechaIso ? new Date(fechaIso).getTime() : NaN;
        if (Number.isNaN(t)) return false;
        if (fromMs && t < fromMs) return false;
        if (toMs && t > toMs) return false;
        return true;
      });
    }

    arr.sort((a, b) => {
      const da = new Date(a.fecha ?? a.fecha_venta ?? a.created_at ?? 0).getTime();
      const db = new Date(b.fecha ?? b.fecha_venta ?? b.created_at ?? 0).getTime();
      return da - db;
    });

    return arr;
  }, [items, showPagadas, qClienta, dateFrom, dateTo]);

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
          <h2 className="list-title">Ventas</h2>

          <div className="list-header-actions">
            <Link to="/ventas/nueva" className="btn primary">
              Nueva Venta
            </Link>

            <button type="button" className="btn" onClick={fetchAll}>
              Recargar
            </button>
          </div>
        </div>

        <div className="filters-card">
          <h3 className="filters-title">Filtros</h3>

          <label className="role-check">
            <input
              type="checkbox"
              checked={showPagadas}
              onChange={(e) => setShowPagadas(e.target.checked)}
            />
            Mostrar solo ventas pagadas
          </label>

          <div className="form-field" style={{ marginTop: 10 }}>
            <label>Buscar por clienta</label>
            <input
              type="text"
              value={qClienta}
              onChange={(e) => setQClienta(e.target.value)}
              placeholder="Ej: Andrea"
            />
          </div>

          <div className="form-row two-cols" style={{ marginTop: 10 }}>
            <div className="form-field">
              <label>Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              disabled={!dateFrom && !dateTo}
            >
              Limpiar fechas
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 10 }}>
            No hay ventas para mostrar.
          </p>
        ) : (
          <div className={`cards-grid ${filtered.length % 2 === 1 ? "odd" : ""}`} style={{ marginTop: 14 }}>
            {filtered.map((v) => {
              const id = v.id_venta ?? v.id ?? v.venta_id;
              const fecha = v.fecha ?? v.fecha_venta ?? v.created_at ?? null;

              const clienta =
                `${v.clienta_nombre ?? ""} ${v.clienta_apellido ?? ""}`.trim() || "-";
              const total = v.total ?? v.monto_total ?? 0;
              const estadoPago = v.estado_pago ?? "-";

              const pagado = isPagoPagado(estadoPago);

              return (
                <div key={id ?? `${fecha}-${Math.random()}`} className="list-item-card">
                  <div className="card-top">
                    <div className="card-title">{clienta}</div>
                    <div className="card-sub">{formatDateTime(fecha)}</div>
                  </div>

                  <div className="card-mid">
                    <div className="card-line">
                      <span className="muted">Total:</span>{" "}
                      <strong>{moneyCLP(total)}</strong>
                    </div>

                    <div className="chips">
                      <span className={`chip ${pagado ? "ok" : ""}`}>
                        {estadoPago}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions">
                    {id ? (
                      <>
                        <Link to={`/ventas/${id}`} className="btn">
                          Ver Detalle
                        </Link>

                        <Link to={`/ventas/${id}/pagos/nuevo`} className="btn">
                          Pagar
                        </Link>

                        <Link to={`/ventas/${id}/editar`} className="btn">
                          Editar
                        </Link>
                      </>
                    ) : (
                      "-"
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
