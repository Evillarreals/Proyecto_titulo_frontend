import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

export default function ClientaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [raw, setRaw] = useState(null);

  async function fetchDetail() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/clientas/${id}`);
      setRaw(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle de la clienta");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Soporta ambos formatos:
  // - objeto plano: { id_clienta, nombre, ... }
  // - objeto envuelto: { clienta: { ... } }
  const clienta = useMemo(() => {
    if (!raw) return null;
    if (raw.clienta && typeof raw.clienta === "object") return raw.clienta;
    return raw;
  }, [raw]);

  const nombreCompleto = useMemo(() => {
    if (!clienta) return "";
    return `${clienta.nombre ?? ""} ${clienta.apellido ?? ""}`.trim();
  }, [clienta]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;
  if (!clienta) return <div>No existe la clienta.</div>;

  return (
    <div>
      <h1>Detalle Clienta</h1>

      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => navigate(-1)}>
          Volver
        </button>{" "}
        | <Link to="/clientas">Ir al listado</Link>{" "}
        {/* Si después haces editar: */}
        {/* | <Link to={`/clientas/${clienta.id_clienta}/editar`}>Editar</Link> */}
      </div>

      <hr />

      <h2>Información general</h2>

      <p>
        <strong>Nombre:</strong> {nombreCompleto || "-"}
      </p>

      <p>
        <strong>Email:</strong> {clienta.email || "-"}
      </p>

      <p>
        <strong>Teléfono:</strong> {clienta.telefono || "-"}
      </p>

      <p>
        <strong>Dirección:</strong> {clienta.direccion || "-"}
      </p>

      {"activo" in clienta && (
        <p>
          <strong>Activo:</strong> {Number(clienta.activo) === 1 ? "sí" : "no"}
        </p>
      )}

      <hr />

      <h2>Acciones rápidas</h2>
      <ul>
        <li>
          <Link to="/ventas/nueva">Registrar venta</Link>
        </li>
        <li>
          <Link to="/atenciones/nueva">Agendar atención</Link>
        </li>
      </ul>

      {/* Si después quieres, acá podemos listar "ventas" y "atenciones" asociadas a la clienta,
          pero necesitaríamos endpoints tipo /clientas/:id/ventas o filtros en /ventas? */}
    </div>
  );
}
