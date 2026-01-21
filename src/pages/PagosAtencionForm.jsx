import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function PagosAtencionForm() {
  const navigate = useNavigate();
  const params = useParams();

  const [idAtencion, setIdAtencion] = useState(params?.id || "");
  const [atencionInfo, setAtencionInfo] = useState(null);

  const [monto, setMonto] = useState("");
  const [medioPago, setMedioPago] = useState("efectivo");

  const [loadingAtencion, setLoadingAtencion] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const idAtencionNum = useMemo(() => Number(idAtencion), [idAtencion]);

  const fetchAtencion = async (id) => {
    setError("");
    setOkMsg("");

    const idNum = Number(id);
    if (!id || Number.isNaN(idNum) || idNum <= 0) {
      setError("Ingresa un id_atencion válido para buscar.");
      return;
    }

    try {
      setLoadingAtencion(true);
      const { data } = await http.get(`/atenciones/${idNum}`);
      setAtencionInfo(data);
    } catch (e) {
      setAtencionInfo(null);
      setError(e?.response?.data?.message || "No se pudo cargar la atención.");
    } finally {
      setLoadingAtencion(false);
    }
  };

  useEffect(() => {
    if (params?.id) fetchAtencion(params.id);
  }, [params?.id]);

  const onBuscarAtencion = async (ev) => {
    ev.preventDefault();
    await fetchAtencion(idAtencion);
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setError("");
    setOkMsg("");

    if (!idAtencion || Number.isNaN(idAtencionNum) || idAtencionNum <= 0) {
      setError("id_atencion es obligatorio y debe ser numérico.");
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
        id_atencion: idAtencionNum,
        monto: montoNum,
        medio_pago: medioPago,
      };

      const { data } = await http.post("/pagos-atencion", payload);

      setOkMsg(
        `Pago registrado. Estado: ${data?.estado_pago ?? "ok"} | Total pagado: ${
          data?.totalPagado ?? "-"
        }`
      );

      await fetchAtencion(idAtencionNum);
      setMonto("");
    } catch (e) {
      setError(e?.response?.data?.message || "Error al registrar pago.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const atencion = atencionInfo?.atencion ?? atencionInfo ?? null;
  const resumenBackend = atencionInfo?.resumenPago ?? null;

  const clienteNombre = atencion?.cliente_nombre ?? atencion?.clienta_nombre ?? "";
  const clienteApellido = atencion?.cliente_apellido ?? atencion?.clienta_apellido ?? "";

  const totalAtencionNum =
    Number(
      atencion?.total ??
        atencion?.total_atencion ??
        atencion?.monto_total ??
        atencion?.totalAtencion ??
        0
    ) || 0;

  const totalPagadoNum =
    Number(
      resumenBackend?.totalPagado ?? atencion?.total_pagado ?? atencion?.totalPagado ?? 0
    ) || 0;

  const saldoNum = Number(resumenBackend?.saldo ?? totalAtencionNum - totalPagadoNum) || 0;

  const estadoPago = atencion?.estado_pago ?? "";

  return (
    <div className="page-center">
      <div className="form-card">
        <h2 className="form-title">Registrar pago de atención</h2>

        {atencion && (
          <div className="resume-box">
            <h3>Atención #{atencion?.id_atencion ?? ""}</h3>

            <p>
              <strong>Clienta:</strong> {clienteNombre} {clienteApellido}
            </p>

            <p>
              <strong>Total atención:</strong> $
              {resumenBackend?.totalAtencion ?? totalAtencionNum}
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

            <div className="form-actions">
              <Link to={`/atenciones/${atencion?.id_atencion}`} className="btn">
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
            <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
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
            <button type="submit" className="btn primary" disabled={loadingSubmit}>
              {loadingSubmit ? "Registrando..." : "Registrar pago"}
            </button>

            <button type="button" className="btn" onClick={() => navigate(-1)}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
