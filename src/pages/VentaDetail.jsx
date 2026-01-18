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

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "$0";
  return `$${n.toFixed(0)}`;
}

export default function VentaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [venta, setVenta] = useState(null);
  const [items, setItems] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [resumenPago, setResumenPago] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchVenta() {
      setLoading(true);
      setErr("");
      try {
        const res = await http.get(`/ventas/${id}`);

        // Soportar 2 formatos:
        // A) plano: { ...venta, items: [...], pagos: [...], resumenPago: {...} }
        // B) anidado: { venta: {...}, items: [...], pagos: [...], resumenPago: {...} }
        const data = res.data ?? {};
        const v = data.venta ?? data;
        const its = data.items ?? v.items ?? [];
        const ps = data.pagos ?? v.pagos ?? [];
        const rp = data.resumenPago ?? v.resumenPago ?? null;

        if (!mounted) return;
        setVenta(v || null);
        setItems(Array.isArray(its) ? its : []);
        setPagos(Array.isArray(ps) ? ps : []);
        setResumenPago(rp || null);
      } catch (e) {
        console.error(e);
        if (!mounted) return;
        setErr("No se pudo cargar el detalle de la venta");
        setVenta(null);
        setItems([]);
        setPagos([]);
        setResumenPago(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchVenta();
    return () => {
      mounted = false;
    };
  }, [id]);

  const info = useMemo(() => {
    if (!venta) return null;

    const idVenta = venta.id_venta ?? venta.id ?? venta.venta_id ?? id;
    const fecha = venta.fecha ?? venta.fecha_venta ?? venta.created_at ?? null;

    const clienteNombre = `${venta.clienta_nombre ?? ""} ${venta.clienta_apellido ?? ""}`.trim();
    const clienteTel = venta.clienta_telefono ?? venta.telefono ?? null;
    const clienteEmail = venta.clienta_email ?? venta.email ?? null;
    const clienteDir = venta.clienta_direccion ?? venta.direccion ?? null;

    // ✅ Vendedora (personal asociado a la venta)
    const vendedoraNombre = `${venta.personal_nombre ?? ""} ${venta.personal_apellido ?? ""}`.trim();

    const total = venta.total ?? venta.total_venta ?? venta.monto_total ?? 0;
    const estadoPago = venta.estado_pago ?? venta.estado ?? "";

    return {
      idVenta,
      fecha,
      clienteNombre: clienteNombre || "-",
      clienteTel: clienteTel || "-",
      clienteEmail: clienteEmail || "-",
      clienteDir: clienteDir || "-",
      vendedoraNombre: vendedoraNombre || "-", // ✅
      total,
      estadoPago: estadoPago || "-",
    };
  }, [venta, id]);

  const resumen = useMemo(() => {
    const totalVenta =
      resumenPago?.totalVenta ??
      resumenPago?.total_venta ??
      resumenPago?.total ??
      info?.total ??
      0;

    const totalPagado = resumenPago?.totalPagado ?? resumenPago?.total_pagado ?? 0;
    const saldo = resumenPago?.saldo ?? (Number(totalVenta) - Number(totalPagado));

    return {
      totalVenta: Number(totalVenta) || 0,
      totalPagado: Number(totalPagado) || 0,
      saldo: Number(saldo) || 0,
    };
  }, [resumenPago, info]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;
  if (!venta || !info) return <div>No existe la venta.</div>;

  return (
    <div>
      <h1>Detalle Venta</h1>

      <div style={{ marginBottom: 10 }}>
        <button type="button" onClick={() => navigate(-1)}>
          Volver
        </button>{" "}
        | <Link to={`/ventas/${info.idVenta}/pagos/nuevo`}>Ir a pagar</Link>{" "}
        | <Link to={`/ventas/${info.idVenta}/editar`}>Editar</Link>
      </div>

      <hr />

      <h2>Información general</h2>

      <p>
        <strong>Fecha:</strong> {formatDateTime(info.fecha)}
      </p>

      <p>
        <strong>Clienta:</strong> {info.clienteNombre}
      </p>

      <p>
        <strong>Vendedora:</strong> {info.vendedoraNombre}
      </p>

      <p>
        <strong>Teléfono:</strong> {info.clienteTel}
      </p>

      <p>
        <strong>Dirección:</strong> {info.clienteDir}
      </p>

      <p>
        <strong>Email:</strong> {info.clienteEmail}
      </p>

      <p>
        <strong>Total venta:</strong> {moneyCLP(info.total)}
      </p>

      <p>
        <strong>Estado pago:</strong> {info.estadoPago}
      </p>

      <p>
        <strong>Total pagado:</strong> {moneyCLP(resumen.totalPagado)}
      </p>

      <p>
        <strong>Saldo:</strong> {moneyCLP(resumen.saldo)}
      </p>

      <hr />

      <h2>Productos</h2>

      {items.length === 0 ? (
        <p>No hay productos en esta venta.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => {
              const nombre = it.producto_nombre ?? it.nombre_producto ?? null;
              const idProd = it.id_producto ?? it.producto_id ?? "-";
              const cantidad = Number(it.cantidad ?? 0) || 0;
              const precio = Number(it.precio_unitario ?? it.precio ?? 0) || 0;
              const subtotal = cantidad * precio;

              return (
                <tr key={it.id_detalle ?? it.id_item ?? idx}>
                  <td>{nombre ? nombre : `#${idProd}`}</td>
                  <td>{cantidad}</td>
                  <td>{moneyCLP(precio)}</td>
                  <td>{moneyCLP(subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <hr />

      <h2>Pagos</h2>

      {pagos.length === 0 ? (
        <p>No hay pagos registrados.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Monto</th>
              <th>Medio</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p, idx) => {
              const fecha = p.fecha ?? p.created_at ?? p.fecha_pago ?? null;
              const monto = p.monto ?? p.total ?? 0;
              const medio = p.medio_pago ?? p.medio ?? "-";
              return (
                <tr key={p.id_pago_venta ?? p.id_pago ?? idx}>
                  <td>{formatDateTime(fecha)}</td>
                  <td>{moneyCLP(monto)}</td>
                  <td>{medio}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
