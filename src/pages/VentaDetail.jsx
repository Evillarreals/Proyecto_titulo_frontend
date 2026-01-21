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
      vendedoraNombre: vendedoraNombre || "-",
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

  if (!venta || !info) {
    return (
      <div className="page-center">
        <div className="form-card">
          <h2 className="form-title">Detalle venta</h2>
          <p style={{ textAlign: "center" }}>No existe la venta.</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const chipPago = resumen.saldo <= 0 ? "chip ok" : "chip";

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Detalle venta #{info.idVenta}</h2>

          <div className="list-header-actions">
            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>

            <Link to={`/ventas/${info.idVenta}/editar`} className="btn">
              Editar
            </Link>

            <Link to={`/ventas/${info.idVenta}/pagos/nuevo`} className="btn primary">
              Ir a pagar
            </Link>

            <Link to="/ventas" className="btn">
              Ir al listado
            </Link>
          </div>
        </div>

        <div className="resume-box" style={{ marginTop: 14 }}>
          <div className="card-top" style={{ marginBottom: 10 }}>
            <div className="card-title">{info.clienteNombre}</div>
            <div className="card-sub">{formatDateTime(info.fecha)}</div>
          </div>

          <div className="card-mid" style={{ justifyContent: "space-between" }}>
            <div className="card-line">
              <span className="muted">Vendedora:</span>{" "}
              <strong>{info.vendedoraNombre}</strong>
            </div>

            <div className="chips">
              <span className="chip">{info.estadoPago}</span>
              <span className={chipPago}>{resumen.saldo <= 0 ? "pagado" : "pendiente"}</span>
            </div>
          </div>

          <div className="card-mid" style={{ justifyContent: "flex-start" }}>
            <div className="card-line">
              <span className="muted">Teléfono:</span> {info.clienteTel}
            </div>
            <div className="card-line">
              <span className="muted">Dirección:</span> {info.clienteDir}
            </div>
            <div className="card-line">
              <span className="muted">Email:</span> {info.clienteEmail}
            </div>
          </div>

          <div className="card-mid" style={{ justifyContent: "space-between" }}>
            <div className="card-line">
              <span className="muted">Total venta:</span>{" "}
              <strong>{moneyCLP(info.total)}</strong>
            </div>

            <div className="card-line">
              <span className="muted">Total pagado:</span>{" "}
              <strong>{moneyCLP(resumen.totalPagado)}</strong>
            </div>

            <div className="card-line">
              <span className="muted">Saldo:</span>{" "}
              <strong>{moneyCLP(resumen.saldo)}</strong>
            </div>
          </div>
        </div>

        <div className="filters-card" style={{ marginTop: 14 }}>
          <h3 className="filters-title">Productos</h3>

          {items.length === 0 ? (
            <p style={{ textAlign: "center" }}>No hay productos en esta venta.</p>
          ) : (
            <div className={`cards-grid ${items.length % 2 === 1 ? "odd" : ""}`}>
              {items.map((it, idx) => {
                const nombre = it.producto_nombre ?? it.nombre_producto ?? null;
                const idProd = it.id_producto ?? it.producto_id ?? "-";
                const cantidad = Number(it.cantidad ?? 0) || 0;
                const precio = Number(it.precio_unitario ?? it.precio ?? 0) || 0;
                const subtotal = cantidad * precio;

                return (
                  <div key={it.id_detalle ?? it.id_item ?? idx} className="list-item-card">
                    <div className="card-top">
                      <div className="card-title">
                        {nombre ? nombre : `#${idProd}`}
                      </div>
                      <div className="card-sub">
                        {cantidad} x {moneyCLP(precio)}
                      </div>
                    </div>

                    <div className="card-mid" style={{ justifyContent: "space-between" }}>
                      <div className="card-line">
                        <span className="muted">Subtotal:</span>{" "}
                        <strong>{moneyCLP(subtotal)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="filters-card" style={{ marginTop: 14 }}>
          <h3 className="filters-title">Pagos</h3>

          {pagos.length === 0 ? (
            <p style={{ textAlign: "center" }}>No hay pagos registrados.</p>
          ) : (
            <div className={`cards-grid ${pagos.length % 2 === 1 ? "odd" : ""}`}>
              {pagos.map((p, idx) => {
                const fecha = p.fecha ?? p.created_at ?? p.fecha_pago ?? null;
                const monto = p.monto ?? p.total ?? 0;
                const medio = p.medio_pago ?? p.medio ?? "-";

                return (
                  <div key={p.id_pago_venta ?? p.id_pago ?? idx} className="list-item-card">
                    <div className="card-top">
                      <div className="card-title">{moneyCLP(monto)}</div>
                      <div className="card-sub">{formatDateTime(fecha)}</div>
                    </div>

                    <div className="card-mid" style={{ justifyContent: "flex-start" }}>
                      <div className="card-line">
                        <span className="muted">Medio:</span> {medio}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
