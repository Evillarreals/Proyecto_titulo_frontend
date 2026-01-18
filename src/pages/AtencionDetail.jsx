import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;
  if (!data || !atencion) return <div>No existe la atención.</div>;

  // Backend devuelve: clienta_telefono, clienta_direccion (según tu Postman)
  const telefono = atencion.clienta_telefono ?? atencion.cliente_telefono ?? "-";
  const direccion = atencion.clienta_direccion ?? atencion.cliente_direccion ?? "-";

  return (
    <div>
      <h1>Detalle Atención</h1>

      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => navigate(-1)}>
          Volver
        </button>{" "}
        | <Link to={`/atenciones/${atencion.id_atencion}/pagos/nuevo`}>Ir a pagar</Link>{" "}
        | <Link to={`/atenciones/${atencion.id_atencion}/editar`}>Editar</Link>
      </div>

      <hr />

      <h2>Información general</h2>

      <p>
        <strong>Fecha:</strong> {formatDateTime(atencion.fecha_inicio)}
      </p>

      <p>
        <strong>Clienta:</strong> {clienteNombre || "-"}
      </p>
      
      <p>
        <strong>Masoterapeuta:</strong> {masoterapeutaNombre || "-"}
      </p>

      <p>
        <strong>Teléfono:</strong> {telefono}
      </p>

      <p>
        <strong>Dirección:</strong> {direccion}
      </p>

      <p>
        <strong>Total:</strong> {formatMoney(atencion.total)}
      </p>

      <p>
        <strong>Estado atención:</strong> {atencion.estado_atencion ?? "-"}
      </p>

      <p>
        <strong>Estado pago:</strong> {estadoPago}
      </p>

      <p>
        <strong>Duración total:</strong> {duracionTotal} min
      </p>

      <hr />

      <h2>Servicios asociados</h2>

      {servicios.length === 0 ? (
        <p>No hay servicios asociados.</p>
      ) : (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>Duración (min)</th>
              <th>Precio aplicado</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id_atencion_servicio ?? `${s.id_servicio}-${s.servicio_nombre}`}>
                <td>{s.servicio_nombre ?? "-"}</td>
                <td>{Number(s.duracion_min ?? 0)}</td>
                <td>{formatMoney(s.precio_aplicado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr />

      <h2>Pagos</h2>

      {pagos.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        <table border="1" cellPadding="6" cellSpacing="0">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Medio</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id_pago_atencion ?? `${p.fecha}-${p.monto}-${p.medio_pago}`}>
                <td>{formatDateTime(p.fecha)}</td>
                <td>{formatMoney(p.monto)}</td>
                <td>{p.medio_pago ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <hr />

      <h3>Resumen de pago</h3>
      <p>
        <strong>Total atención:</strong> {formatMoney(resumenPago?.totalAtencion ?? atencion.total)}
      </p>
      <p>
        <strong>Total pagado:</strong> {formatMoney(resumenPago?.totalPagado ?? 0)}
      </p>
      <p>
        <strong>Saldo:</strong> {formatMoney(resumenPago?.saldo ?? 0)}
      </p>
    </div>
  );
}
