import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

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
    return personal.filter((p) =>
      Array.isArray(p?.roles) && p.roles.some((r) => String(r?.nombre).toLowerCase() === "masoterapeuta")
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

      return (
        cliente.includes(term) ||
        estadoAtencion.includes(term) ||
        estadoPago.includes(term)
      );
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

  if (loading) return <p>Cargando atenciones...</p>;

  return (
    <div>
      <h1>Atenciones</h1>

      <p>
        <Link to="/atenciones/nueva">+ Nueva atención</Link>{" "}
        <button onClick={fetchAtenciones}>Recargar</button>
      </p>

      <fieldset style={{ padding: 10 }}>
        <legend>Filtros</legend>

        <div style={{ marginBottom: 8 }}>
          <label>
            Buscar:{" "}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="clienta, estado atención o pago..."
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Día:{" "}
            <input
              type="date"
              value={fechaDia}
              onChange={(e) => setFechaDia(e.target.value)}
            />
          </label>{" "}
          {fechaDia && (
            <button type="button" onClick={() => setFechaDia("")}>
              Limpiar día
            </button>
          )}
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Masoterapeuta:{" "}
            <select
              value={idMasoterapeuta}
              onChange={(e) => setIdMasoterapeuta(e.target.value)}
            >
              <option value="">-- Todas --</option>
              {masoterapeutas.map((p) => (
                <option key={p.id_personal} value={p.id_personal}>
                  {p.nombre} {p.apellido} (#{p.id_personal})
                </option>
              ))}
            </select>
          </label>{" "}
          {idMasoterapeuta && (
            <button type="button" onClick={() => setIdMasoterapeuta("")}>
              Limpiar masoterapeuta
            </button>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={soloCerradas}
              onChange={(e) => toggleSoloCerradas(e.target.checked)}
            />{" "}
            Ver solo atenciones realizadas y pagadas
          </label>
        </div>

        <div style={{ marginTop: 6 }}>
          <label>
            <input
              type="checkbox"
              checked={soloCanceladas}
              onChange={(e) => toggleSoloCanceladas(e.target.checked)}
            />{" "}
            Ver solo atenciones canceladas
          </label>
        </div>
      </fieldset>

      {err && <p style={{ color: "red" }}>{err}</p>}

      {!err && filteredAndSorted.length === 0 && <p>No hay atenciones.</p>}

      {!err &&
        grouped.map(([dia, items]) => (
          <div key={dia} style={{ marginTop: 12 }}>
            <h3>{dia || "Sin fecha"}</h3>

            <table border="1" cellPadding="6" cellSpacing="0">
              <thead>
                <tr>
                  <th>Clienta</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado atención</th>
                  <th>Estado pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {items.map((a) => {
                  const id = a?.id_atencion ?? a?.id;

                  const nombre = a?.cliente_nombre ?? a?.clienta_nombre ?? "";
                  const apellido = a?.cliente_apellido ?? a?.clienta_apellido ?? "";

                  const fecha = a?.fecha_inicio ?? a?.fecha ?? "";
                  const total = a?.total ?? a?.monto_total ?? a?.total_atencion ?? "";

                  const estadoAtencion = String(a?.estado_atencion ?? a?.estado ?? "");
                  const estadoAtencionLower = estadoAtencion.toLowerCase();
                  const estadoPago = String(a?.estado_pago ?? "");

                  return (
                    <tr key={id}>
                      <td>
                        {nombre} {apellido}
                      </td>
                      <td>{formatFecha(fecha)}</td>
                      <td>{total !== "" ? `$${total}` : ""}</td>
                      <td>{estadoAtencion}</td>
                      <td>{estadoPago}</td>
                      <td>
                        <Link to={`/atenciones/${id}/editar`}>Editar</Link>{" "}
                        | <Link to={`/atenciones/${id}/pagos/nuevo`}>Pagar</Link>{" "}
                        | <Link to={`/atenciones/${id}`}>Ver detalle</Link>

                        {estadoAtencionLower !== "realizada" && (
                          <>
                            {" "}
                            |{" "}
                            <button
                              type="button"
                              onClick={() => cambiarEstado(id, "realizada")}
                            >
                              Marcar realizada
                            </button>
                          </>
                        )}

                        {estadoAtencionLower !== "cancelada" && (
                          <>
                            {" "}
                            |{" "}
                            <button
                              type="button"
                              onClick={() => cambiarEstado(id, "cancelada")}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
