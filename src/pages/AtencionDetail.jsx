import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

function formatMoney(value) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "$0";
  return `$${n.toFixed(0)}`;
}

export default function AtencionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function fetchDetail() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/atenciones/${id}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle de la atención");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const atencion = data?.atencion ?? null;
  const servicios = data?.servicios ?? [];
  const pagos = data?.pagos ?? [];
  const resumenPago = data?.resumenPago ?? null;

  const clienteNombre = useMemo(() => {
    if (!atencion) return "";
    const nom = atencion.clienta_nombre ?? "";
    const ape = atencion.clienta_apellido ?? "";
    return `${nom} ${ape}`.trim();
  }, [atencion]);

  const masoterapeutaNombre = useMemo(() => {
    if (!atencion) return "";
    const nom = atencion.personal_nombre ?? "";
    const ape = atencion.personal_apellido ?? "";
    return `${nom} ${ape}`.trim();
  }, [atencion]);

  const duracionTotal = useMemo(() => {
    return servicios.reduce((acc, s) => acc + Number(s?.duracion_min ?? 0), 0);
  }, [servicios]);

  const estadoPago = useMemo(() => {
    const saldo = Number(resumenPago?.saldo ?? NaN);
    if (!Number.isNaN(saldo)) return saldo <= 0 ? "pagado" : "pendiente";

    const total = Number(atencion?.total ?? 0);
    const totalPagado = pagos.reduce((acc, p) => acc + Number(p?.monto ?? 0), 0);
    return totalPagado >= total ? "pagado" : "pendiente";
  }, [resumenPago, atencion, pagos]);

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

  if (!data || !atencion) {
    return (
      <div className="page-center">
        <div className="form-card">
          <h2 className="form-title">Detalle atención</h2>
          <p style={{ textAlign: "center" }}>No existe la atención.</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const telefono = atencion.clienta_telefono ?? atencion.cliente_telefono ?? "-";
  const direccion = atencion.clienta_direccion ?? atencion.cliente_direccion ?? "-";

  const estadoAtencionTxt = atencion.estado_atencion ?? "-";
  const chipAtencion =
    String(estadoAtencionTxt).toLowerCase() === "realizada"
      ? "chip ok"
      : String(estadoAtencionTxt).toLowerCase() === "cancelada"
      ? "chip danger"
      : "chip";

  const chipPago = String(estadoPago).toLowerCase() === "pagado" ? "chip ok" : "chip";

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Detalle atención #{atencion.id_atencion}</h2>

          <div className="list-header-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>

            <Link to={`/atenciones/${atencion.id_atencion}/editar`} className="btn">
              Editar
            </Link>

            <Link to={`/atenciones/${atencion.id_atencion}/pagos/nuevo`} className="btn primary">
              Ir a pagar
            </Link>

            <button type="button" className="btn" onClick={fetchDetail}>
              Recargar
            </button>
          </div>
        </div>

        <div className="resume-box" style={{ marginTop: 14 }}>
          <div className="card-top" style={{ marginBottom: 10 }}>
            <div className="card-title">{clienteNombre || "-"}</div>
            <div className="card-sub">{formatDateTime(atencion.fecha_inicio)}</div>
          </div>

          <div className="card-mid" style={{ justifyContent: "space-between" }}>
            <div className="card-line">
              <span className="muted">Masoterapeuta:</span>{" "}
              <strong>{masoterapeutaNombre || "-"}</strong>
            </div>

            <div className="chips">
              <span className={chipAtencion}>{estadoAtencionTxt}</span>
              <span className={chipPago}>{estadoPago}</span>
            </div>
          </div>

          <div className="card-mid" style={{ justifyContent: "flex-start" }}>
            <div className="card-line">
              <span className="muted">Teléfono:</span> {telefono}
            </div>
            <div className="card-line">
              <span className="muted">Dirección:</span> {direccion}
            </div>
          </div>

          <div className="card-mid" style={{ justifyContent: "space-between" }}>
            <div className="card-line">
              <span className="muted">Total:</span>{" "}
              <strong>{formatMoney(atencion.total)}</strong>
            </div>
            <div className="card-line">
              <span className="muted">Duración total:</span>{" "}
              <strong>{duracionTotal} min</strong>
            </div>
          </div>
        </div>

        <div className="filters-card" style={{ marginTop: 14 }}>
          <h3 className="filters-title">Servicios asociados</h3>

          {servicios.length === 0 ? (
            <p style={{ textAlign: "center" }}>No hay servicios asociados.</p>
          ) : (
            <div className={`cards-grid ${servicios.length % 2 === 1 ? "odd" : ""}`}>
              {servicios.map((s) => (
                <div
                  key={s.id_atencion_servicio ?? `${s.id_servicio}-${s.servicio_nombre}`}
                  className="list-item-card"
                >
                  <div className="card-top">
                    <div className="card-title">{s.servicio_nombre ?? "-"}</div>
                    <div className="card-sub">
                      {Number(s.duracion_min ?? 0)} min
                    </div>
                  </div>

                  <div className="card-mid" style={{ justifyContent: "flex-start" }}>
                    <div className="card-line">
                      <span className="muted">Precio aplicado:</span>{" "}
                      <strong>{formatMoney(s.precio_aplicado)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="filters-card" style={{ marginTop: 14 }}>
          <h3 className="filters-title">Pagos</h3>

          {pagos.length === 0 ? (
            <p style={{ textAlign: "center" }}>No hay pagos registrados.</p>
          ) : (
            <div className={`cards-grid ${pagos.length % 2 === 1 ? "odd" : ""}`}>
              {pagos.map((p) => (
                <div
                  key={p.id_pago_atencion ?? `${p.fecha}-${p.monto}-${p.medio_pago}`}
                  className="list-item-card"
                >
                  <div className="card-top">
                    <div className="card-title">{formatMoney(p.monto)}</div>
                    <div className="card-sub">{formatDateTime(p.fecha)}</div>
                  </div>

                  <div className="card-mid" style={{ justifyContent: "flex-start" }}>
                    <div className="card-line">
                      <span className="muted">Medio:</span> {p.medio_pago ?? "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="resume-box" style={{ marginTop: 14 }}>
          <h3 style={{ textAlign: "center", marginTop: 0 }}>Resumen de pago</h3>

          <div className="card-mid" style={{ justifyContent: "space-between" }}>
            <div className="card-line">
              <span className="muted">Total atención:</span>{" "}
              <strong>{formatMoney(resumenPago?.totalAtencion ?? atencion.total)}</strong>
            </div>

            <div className="card-line">
              <span className="muted">Total pagado:</span>{" "}
              <strong>{formatMoney(resumenPago?.totalPagado ?? 0)}</strong>
            </div>

            <div className="card-line">
              <span className="muted">Saldo:</span>{" "}
              <strong>{formatMoney(resumenPago?.saldo ?? 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
