import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `$${n.toFixed(0)}`;
}

export default function ProductoDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [raw, setRaw] = useState(null);

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/productos/${id}`);
      setRaw(res.data);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle del producto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const producto = useMemo(() => {
    if (!raw) return null;
    if (raw.producto && typeof raw.producto === "object") return raw.producto;
    if (raw.data && typeof raw.data === "object") return raw.data;
    return raw;
  }, [raw]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;
  if (!producto) return <div>No existe el producto.</div>;

  const nombre = producto.nombre ?? "-";
  const precio =
    producto.precio ?? producto.precio_unitario ?? producto.precio_base ?? null;
  const stock = producto.stock ?? "-";
  const stockMin = producto.stock_minimo ?? producto.stock_min ?? null;

  const activoTxt =
    "activo" in producto ? (Number(producto.activo) === 1 ? "sí" : "no") : null;

  return (
    <div>
      <h1>Detalle Producto</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to="/productos">Volver</Link>{" "}
        | <Link to={`/productos/${id}/editar`}>Editar</Link>{" "}
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
        <strong>Precio:</strong> {precio !== null ? moneyCLP(precio) : "-"}
      </p>

      <p>
        <strong>Stock:</strong> {stock}
      </p>

      {stockMin !== null && (
        <p>
          <strong>Stock mínimo:</strong> {stockMin}
        </p>
      )}

      {activoTxt !== null && (
        <p>
          <strong>Activo:</strong> {activoTxt}
        </p>
      )}

      {/* Si después quieres, acá podemos mostrar advertencia:
          stock <= stock_minimo => "Alerta: bajo stock" */}
    </div>
  );
}
