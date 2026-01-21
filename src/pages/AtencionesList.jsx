import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

function formatFecha(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} ${dd}/${MM}/${yyyy}`;
}

function dayKey(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, "0");
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${MM}/${yyyy}`;
}

function isoDay(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}`;
}

export default function AtencionesList() {
  const [rows, setRows] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const [soloCerradas, setSoloCerradas] = useState(false);
  const [soloCanceladas, setSoloCanceladas] = useState(false);

  const [fechaDia, setFechaDia] = useState("");
  const [idMasoterapeuta, setIdMasoterapeuta] = useState("");

  const fetchAtenciones = async () => {
    try {
      setLoading(true);
      setErr("");

      const { data } = await http.get("/atenciones");
      const list = Array.isArray(data) ? data : data?.atenciones ?? [];
      setRows(list);
    } catch (e) {
      setErr(e?.response?.data?.message || "No se pudieron cargar las atenciones.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonal = async () => {
    try {
      const { data } = await http.get("/personal");
      const list = Array.isArray(data) ? data : data?.personal ?? [];
      setPersonal(list);
    } catch (e) {
      console.error("Error cargando personal:", e);
      setPersonal([]);
    }
  };

  useEffect(() => {
    fetchAtenciones();
    fetchPersonal();
  }, []);

  async function cambiarEstado(idAtencion, nuevoEstado) {
    try {
      setErr("");
      await http.patch(`/atenciones/${idAtencion}/estado`, {
        estado_atencion: nuevoEstado,
      });
      await fetchAtenciones();
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || "No se pudo cambiar el estado de la atención.");
    }
  }

  const masoterapeutas = useMemo(() => {
    return personal.filter(
      (p) =>
        Array.isArray(p?.roles) &&
        p.roles.some((r) => String(r?.nombre).toLowerCase() === "masoterapeuta")
    );
  }, [personal]);

  const filteredAndSorted = useMemo(() => {
    const term = q.trim().toLowerCase();

    const filtradas = rows.filter((a) => {
      const estadoAtencion = String(a?.estado_atencion ?? a?.estado ?? "").toLowerCase();
      const estadoPago = String(a?.estado_pago ?? "").toLowerCase();

      const esCerrada = estadoAtencion === "realizada" && estadoPago === "pagado";
      const esCancelada = estadoAtencion === "cancelada";

      if (soloCerradas) {
        if (!esCerrada) return false;
      } else if (soloCanceladas) {
        if (!esCancelada) return false;
      } else {
        if (esCerrada) return false;
        if (esCancelada) return false;
      }

      if (fechaDia) {
        const f = a?.fecha_inicio ?? a?.fecha ?? "";
        if (isoDay(f) !== fechaDia) return false;
      }

      if (idMasoterapeuta) {
        const pid = String(a?.id_personal ?? "");
        if (pid !== String(idMasoterapeuta)) return false;
      }

      if (!term) return true;

      const nombre = a?.cliente_nombre ?? a?.clienta_nombre ?? "";
      const apellido = a?.cliente_apellido ?? a?.clienta_apellido ?? "";
      const cliente = `${nombre} ${apellido}`.trim().toLowerCase();

      return cliente.includes(term) || estadoAtencion.includes(term) || estadoPago.includes(term);
    });

    const sorted = [...filtradas].sort((a, b) => {
      const fa = new Date(a?.fecha_inicio ?? a?.fecha ?? 0).getTime();
      const fb = new Date(b?.fecha_inicio ?? b?.fecha ?? 0).getTime();
      return fa - fb;
    });

    return sorted;
  }, [rows, q, soloCerradas, soloCanceladas, fechaDia, idMasoterapeuta]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const a of filteredAndSorted) {
      const k = dayKey(a?.fecha_inicio ?? a?.fecha);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(a);
    }
    return Array.from(map.entries());
  }, [filteredAndSorted]);

  function toggleSoloCerradas(checked) {
    setSoloCerradas(checked);
    if (checked) setSoloCanceladas(false);
  }

  function toggleSoloCanceladas(checked) {
    setSoloCanceladas(checked);
    if (checked) setSoloCerradas(false);
  }

  if (loading) {
    return (
      <div className="page-center">
        <p>Cargando atenciones...</p>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Atenciones</h2>

          <div className="list-header-actions">
            <Link to="/atenciones/nueva" className="btn primary">
              Nueva Atencion
            </Link>

            <button type="button" className="btn" onClick={fetchAtenciones}>
              Recargar
            </button>
          </div>
        </div>

        <div className="filters-card">
          <h3 className="filters-title">Filtros</h3>

          <div className="form-field">
            <label>Buscar</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="clienta, estado atención o pago..."
            />
          </div>

          <div className="form-row two-cols">
            <div className="form-field">
              <label>Día</label>
              <input type="date" value={fechaDia} onChange={(e) => setFechaDia(e.target.value)} />
            </div>

            <div className="form-field" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setFechaDia("")}
                disabled={!fechaDia}
              >
                Limpiar día
              </button>
            </div>
          </div>

          <div className="form-row two-cols">
            <div className="form-field">
              <label>Masoterapeuta</label>
              <select value={idMasoterapeuta} onChange={(e) => setIdMasoterapeuta(e.target.value)}>
                <option value="">-- Todas --</option>
                {masoterapeutas.map((p) => (
                  <option key={p.id_personal} value={p.id_personal}>
                    {p.nombre} {p.apellido} (#{p.id_personal})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn"
                onClick={() => setIdMasoterapeuta("")}
                disabled={!idMasoterapeuta}
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="checks-row">
            <label className="role-check">
              <input
                type="checkbox"
                checked={soloCerradas}
                onChange={(e) => toggleSoloCerradas(e.target.checked)}
              />
              Ver solo realizadas y pagadas
            </label>

            <label className="role-check">
              <input
                type="checkbox"
                checked={soloCanceladas}
                onChange={(e) => toggleSoloCanceladas(e.target.checked)}
              />
              Ver solo canceladas
            </label>
          </div>
        </div>

        {err ? <p className="helper-error">{err}</p> : null}

        {!err && filteredAndSorted.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 10 }}>No hay atenciones.</p>
        ) : null}

        {!err &&
          grouped.map(([dia, items]) => (
            <div key={dia} style={{ marginTop: 14 }}>
              <h3 className="group-title">{dia || "Sin fecha"}</h3>

              <div className={`cards-grid ${items.length % 2 === 1 ? "odd" : ""}`}>
                {items.map((a) => {
                  const id = a?.id_atencion ?? a?.id;

                  const nombre = a?.cliente_nombre ?? a?.clienta_nombre ?? "";
                  const apellido = a?.cliente_apellido ?? a?.clienta_apellido ?? "";
                  const cliente = `${nombre} ${apellido}`.trim();

                  const fecha = a?.fecha_inicio ?? a?.fecha ?? "";
                  const total = a?.total ?? a?.monto_total ?? a?.total_atencion ?? "";

                  const estadoAtencion = String(a?.estado_atencion ?? a?.estado ?? "");
                  const estadoAtencionLower = estadoAtencion.toLowerCase();
                  const estadoPago = String(a?.estado_pago ?? "");

                  const chipAtencion =
                    estadoAtencionLower === "realizada"
                      ? "chip ok"
                      : estadoAtencionLower === "cancelada"
                      ? "chip danger"
                      : "chip";

                  const chipPago =
                    String(estadoPago).toLowerCase() === "pagado" ? "chip ok" : "chip";

                  return (
                    <div key={id} className="list-item-card">
                      <div className="card-top">
                        <div className="card-title">{cliente || "Sin nombre"}</div>
                        <div className="card-sub">{formatFecha(fecha)}</div>
                      </div>

                      <div className="card-mid">
                        <div className="card-line">
                          <span className="muted">Total</span>{" "}
                          <strong>{total !== "" ? `$${total}` : "-"}</strong>
                        </div>

                        <div className="chips">
                          <span className={chipAtencion}>{estadoAtencion || "pendiente"}</span>
                          <span className={chipPago}>{estadoPago || "pendiente"}</span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <Link to={`/atenciones/${id}`} className="btn">
                          Ver Detalle
                        </Link>

                        <Link to={`/atenciones/${id}/editar`} className="btn">
                          Editar
                        </Link>

                        <Link to={`/atenciones/${id}/pagos/nuevo`} className="btn">
                          Pagar
                        </Link>

                        {estadoAtencionLower !== "realizada" && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => cambiarEstado(id, "realizada")}
                          >
                            Marcar realizada
                          </button>
                        )}

                        {estadoAtencionLower !== "cancelada" && (
                          <button
                            type="button"
                            className="btn"
                            onClick={() => cambiarEstado(id, "cancelada")}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
