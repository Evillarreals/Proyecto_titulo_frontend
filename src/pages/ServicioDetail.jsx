import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `$${n.toFixed(0)}`;
}

export default function ServicioDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [raw, setRaw] = useState(null);

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/servicios/${id}`);
      setRaw(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle del servicio");
      setRaw(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
  }, [id]);

  const servicio = useMemo(() => {
    if (!raw) return null;
    if (raw.servicio && typeof raw.servicio === "object") return raw.servicio;
    if (raw.data && typeof raw.data === "object") return raw.data;
    return raw;
  }, [raw]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;
  if (!servicio) return <div>No existe el servicio.</div>;

  const nombre = servicio.nombre ?? "-";
  const dur =
    servicio.duracion_minutos ?? servicio.duracion_min ?? servicio.duracion ?? "-";
  const precio = servicio.precio ?? servicio.precio_base ?? "-";

  const activoTxt =
    "activo" in servicio ? (Number(servicio.activo) === 1 ? "sí" : "no") : null;

  return (
    <div>
      <h1>Detalle Servicio</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to="/servicios">Volver</Link>{" "}
        | <Link to={`/servicios/${id}/editar`}>Editar</Link>{" "}
        |{" "}
        <button type="button" onClick={fetchOne}>
          Recargar
        </button>
      </div>

      <hr />

      <h2>Información general</h2>

      <p>
        <strong>Nombre:</strong> {nombre}
      </p>

      <p>
        <strong>Duración (min):</strong> {dur}
      </p>

      <p>
        <strong>Precio:</strong> {precio !== "-" ? moneyCLP(precio) : "-"}
      </p>

      {activoTxt !== null && (
        <p>
          <strong>Activo:</strong> {activoTxt}
        </p>
      )}
    </div>
  );
}
