import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function PagosVentaForm() {
  const navigate = useNavigate();
  const params = useParams();

  const [idVenta, setIdVenta] = useState(params?.id || "");
  const [ventaInfo, setVentaInfo] = useState(null);

  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("efectivo");

  const [loadingVenta, setLoadingVenta] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const idVentaNum = useMemo(() => Number(idVenta), [idVenta]);

  const fetchVenta = async (id) => {
    setError("");
    setOkMsg("");

    const idNum = Number(id);
    if (!id || Number.isNaN(idNum) || idNum <= 0) {
      setError("Ingresa un ID de venta válido.");
      return;
    }

    try {
      setLoadingVenta(true);
      const { data } = await http.get(`/ventas/${idNum}`);
      setVentaInfo(data);
    } catch (e) {
      setVentaInfo(null);
      setError(e?.response?.data?.message || "No se pudo cargar la venta.");
    } finally {
      setLoadingVenta(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchVenta(params.id);
  }, [params?.id]);

  const onBuscarVenta = async (e) => {
    e.preventDefault();
    await fetchVenta(idVenta);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!idVenta || Number.isNaN(idVentaNum) || idVentaNum <= 0) {
      setError("ID venta inválido.");
      return;
    }

    const montoNum = Number(monto);
    if (!monto || Number.isNaN(montoNum) || montoNum <= 0) {
      setError("Monto inválido.");
      return;
    }

    try {
      setLoadingSubmit(true);

      const payload = {
        id_venta: idVentaNum,
        monto: montoNum,
        medio_pago: medioPago,
      };

      const { data } = await http.post("/pagos-venta", payload);

      setOkMsg(
        `Pago registrado · Total pagado: ${data?.totalPagado ?? "-"}`
      );

      await fetchVenta(idVentaNum);
      setMonto("");
    } catch (e) {
      setError(e?.response?.data?.message || "Error al registrar pago.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const venta = ventaInfo?.venta ?? ventaInfo ?? null;
  const resumen = ventaInfo?.resumenPago ?? null;

  const totalVenta = Number(resumen?.totalVenta ?? venta?.total ?? 0);
  const totalPagado = Number(
    resumen?.totalPagado ?? venta?.total_pagado ?? 0
  );
  const saldo = Number(resumen?.saldo ?? totalVenta - totalPagado);

  return (
    <div className="page-center">
      <div className="form-card">
        <h2 className="form-title">Registrar pago de venta</h2>

        {venta && (
          <div className="resume-box">
            <h3>Venta #{venta.id_venta}</h3>

            <p>
              <strong>Clienta:</strong>{" "}
              {venta.cliente_nombre || venta.clienta_nombre}{" "}
              {venta.cliente_apellido || venta.clienta_apellido}
            </p>

            <p>
              <strong>Total venta:</strong> ${totalVenta}
            </p>

            <p>
              <strong>Total pagado:</strong> ${totalPagado}
            </p>

            <p>
              <strong>Saldo:</strong> ${saldo}
            </p>

            <p>
              <strong>Estado:</strong> {venta.estado_pago}
            </p>

            <div className="form-actions">
              <Link to={`/ventas/${venta.id_venta}`} className="btn">
                Ver detalle
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="form">
          <h3 style={{ textAlign: "center" }}>Datos del pago</h3>

          <div className="form-field">
            <label>Monto</label>
            <input
              type="number"
              min="1"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Medio de pago</label>
            <select
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          {error && <p className="helper-error">{error}</p>}
          {okMsg && (
            <p style={{ textAlign: "center", color: "green", fontWeight: 600 }}>
              {okMsg}
            </p>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn primary"
              disabled={loadingSubmit}
            >
              {loadingSubmit ? "Registrando..." : "Registrar pago"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => navigate(-1)}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
