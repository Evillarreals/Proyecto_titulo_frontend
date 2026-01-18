import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

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

// ✅ considera "pagado" y "pagada" (y variantes)
function isPagoPagado(estadoPago) {
  const s = String(estadoPago ?? "").trim().toLowerCase();
  return s.startsWith("pagad"); // pagado / pagada
}

// ✅ parsea YYYY-MM-DD a inicio/fin de día local
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

  // ✅ checkbox: si está marcado, mostramos SOLO pagadas
  const [showPagadas, setShowPagadas] = useState(false);

  // ✅ buscador por clienta
  const [qClienta, setQClienta] = useState("");

  // ✅ filtro por fecha (día)
  const [dateFrom, setDateFrom] = useState(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState(""); // YYYY-MM-DD

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

    // ✅ filtro pagadas:
    // - showPagadas = true  => SOLO pagadas
    // - showPagadas = false => SOLO NO pagadas (pendiente/parcial/etc)
    arr = arr.filter((v) =>
      showPagadas ? isPagoPagado(v.estado_pago) : !isPagoPagado(v.estado_pago)
    );

    // ✅ buscador por clienta (nombre+apellido)
    const q = qClienta.trim().toLowerCase();
    if (q) {
      arr = arr.filter((v) => {
        const nombre = String(v.clienta_nombre ?? "").toLowerCase();
        const apellido = String(v.clienta_apellido ?? "").toLowerCase();
        const full = `${nombre} ${apellido}`.trim();
        return full.includes(q);
      });
    }

    // ✅ filtro por fecha (día, local)
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

    // ✅ orden ascendente por fecha
    arr.sort((a, b) => {
      const da = new Date(a.fecha ?? a.fecha_venta ?? a.created_at ?? 0).getTime();
      const db = new Date(b.fecha ?? b.fecha_venta ?? b.created_at ?? 0).getTime();
      return da - db;
    });

    return arr;
  }, [items, showPagadas, qClienta, dateFrom, dateTo]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;

  return (
    <div>
      <h1>Ventas</h1>

      <div style={{ marginBottom: 10 }}>
        <Link to="/ventas/nueva">+ Nueva venta</Link> |{" "}
        <button type="button" onClick={fetchAll}>
          Recargar
        </button>
      </div>

      <fieldset style={{ marginBottom: 10 }}>
        <legend>Filtros</legend>

        <div style={{ marginBottom: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={showPagadas}
              onChange={(e) => setShowPagadas(e.target.checked)}
            />{" "}
            Mostrar solo ventas pagadas
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Buscar por clienta:{" "}
            <input
              type="text"
              value={qClienta}
              onChange={(e) => setQClienta(e.target.value)}
              placeholder="Ej: Andrea"
            />
          </label>
        </div>

        <div>
          <label style={{ marginRight: 12 }}>
            Desde:{" "}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>

          <label>
            Hasta:{" "}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>

          <button
            type="button"
            style={{ marginLeft: 12 }}
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Limpiar fechas
          </button>
        </div>
      </fieldset>

      {filtered.length === 0 ? (
        <p>No hay ventas para mostrar.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Clienta</th>
              <th>Total</th>
              <th>Estado pago</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((v) => {
              const id = v.id_venta ?? v.id ?? v.venta_id;
              const fecha = v.fecha ?? v.fecha_venta ?? v.created_at ?? null;

              const clienta = `${v.clienta_nombre ?? ""} ${v.clienta_apellido ?? ""}`.trim() || "-";
              const total = v.total ?? v.monto_total ?? 0;
              const estadoPago = v.estado_pago ?? "-";

              return (
                <tr key={id ?? `${fecha}-${Math.random()}`}>
                  <td>{formatDateTime(fecha)}</td>
                  <td>{clienta}</td>
                  <td>{moneyCLP(total)}</td>
                  <td>{estadoPago}</td>
                  <td>
                    {id ? (
                      <>
                        <Link to={`/ventas/${id}`}>Ver detalle</Link> |{" "}
                        <Link to={`/ventas/${id}/pagos/nuevo`}>Pagar</Link> |{" "}
                        <Link to={`/ventas/${id}/editar`}>Editar</Link>
                      </>
                    ) : (
                      "-"
                    )}
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
