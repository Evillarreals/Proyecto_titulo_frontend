import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import http from "../api/http";

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
      setError("Ingresa un id_venta válido para buscar.");
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

  const onBuscarVenta = async (ev) => {
    ev.preventDefault();
    await fetchVenta(idVenta);
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setOkMsg("");

    if (!idVenta || Number.isNaN(idVentaNum) || idVentaNum <= 0) {
      setError("id_venta es obligatorio y debe ser numérico.");
      return;
    }

    const montoNum = Number(monto);
    if (!monto || Number.isNaN(montoNum) || montoNum <= 0) {
      setError("monto es obligatorio y debe ser > 0.");
      return;
    }

    if (!medioPago) {
      setError("medio_pago es obligatorio.");
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
        `Pago registrado. Estado: ${data?.estado_pago ?? "ok"} | Total pagado: ${
          data?.totalPagado ?? "-"
        }`
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
  const resumenBackend = ventaInfo?.resumenPago ?? null;

  const clienteNombre = venta?.cliente_nombre ?? venta?.clienta_nombre ?? "";
  const clienteApellido = venta?.cliente_apellido ?? venta?.clienta_apellido ?? "";

  const totalVentaNum = Number(venta?.total ?? 0) || 0;

  const totalPagadoNum =
    Number(resumenBackend?.totalPagado ?? venta?.total_pagado ?? venta?.totalPagado ?? 0) || 0;

  const saldoNum =
    Number(resumenBackend?.saldo ?? (totalVentaNum - totalPagadoNum)) || 0;

  const estadoPago = venta?.estado_pago ?? "";

  return (
    <div>
      <h1>Registrar pago de venta</h1>

      <form onSubmit={onBuscarVenta}>
        <fieldset>
          <legend>Buscar venta</legend>

          <label>
            ID Venta{" "}
            <input
              type="number"
              min="1"
              value={idVenta}
              onChange={(e) => setIdVenta(e.target.value)}
            />
          </label>

          <button type="submit" disabled={loadingVenta}>
            {loadingVenta ? "Buscando..." : "Buscar"}
          </button>

          {idVenta && (
            <>
              {" "}
              <Link to={`/ventas/${idVenta}`}>Ver detalle</Link>
            </>
          )}
        </fieldset>
      </form>

      <hr />

      {venta && (
        <div>
          <h2>Resumen venta #{venta?.id_venta ?? ""}</h2>

          <p>
            <strong>Clienta:</strong> {clienteNombre} {clienteApellido}
          </p>

          <p>
            <strong>Total venta:</strong> ${resumenBackend?.totalVenta ?? totalVentaNum}
          </p>

          <p>
            <strong>Total pagado:</strong> ${totalPagadoNum}
          </p>

          <p>
            <strong>Saldo:</strong> ${saldoNum}
          </p>

          <p>
            <strong>Estado pago:</strong> {estadoPago}
          </p>

          <hr />
        </div>
      )}

      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Datos del pago</legend>

          <label>
            ID Venta{" "}
            <input
              type="number"
              min="1"
              value={idVenta}
              onChange={(e) => setIdVenta(e.target.value)}
            />
          </label>

          <br />

          <label>
            Monto{" "}
            <input
              type="number"
              min="1"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </label>

          <br />

          <label>
            Medio de pago{" "}
            <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
              <option value="efectivo">efectivo</option>
              <option value="transferencia">transferencia</option>
              <option value="debito">debito</option>
              <option value="credito">credito</option>
            </select>
          </label>

          <br />
          <br />

          {error && <p style={{ color: "red" }}>{error}</p>}
          {okMsg && <p style={{ color: "green" }}>{okMsg}</p>}

          <button type="submit" disabled={loadingSubmit}>
            {loadingSubmit ? "Registrando..." : "Registrar pago"}
          </button>{" "}
          <button type="button" onClick={() => navigate(-1)}>
            Volver
          </button>
        </fieldset>
      </form>
    </div>
  );
}
