import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

function normalize(str) {
  return (str ?? "").toString().trim().toLowerCase();
}

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `$${n.toFixed(0)}`;
}

export default function ProductosList() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [showInactivos, setShowInactivos] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/productos");
      const list = res.data?.productos ?? res.data?.data ?? res.data;
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar la lista de productos");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function toggleActivo(p) {
    const id = p.id_producto ?? p.id ?? p.producto_id;
    if (!id) return;

    setErr("");
    try {
      const isActivo = Number(p.activo) === 1;

      if (isActivo) {
        await http.delete(`/productos/${id}`);
      } else {
        await http.put(`/productos/${id}/activar`);
      }

      await fetchAll();
    } catch (e) {
      console.error(e);
      setErr("No se pudo cambiar el estado del producto");
    }
  }

  async function sumarStock(p) {
    const id = p.id_producto ?? p.id ?? p.producto_id;
    if (!id) return;

    const input = window.prompt(
      `¿Cuánto stock deseas agregar a "${p.nombre}"?\n(Ingresa un número entero > 0)`,
      "1"
    );

    if (input == null) return;

    const cantidad = Number(input);

    if (!Number.isFinite(cantidad) || !Number.isInteger(cantidad) || cantidad <= 0) {
      alert("Cantidad inválida. Debe ser un entero mayor a 0.");
      return;
    }

    setErr("");
    try {
      const { data } = await http.put(`/productos/${id}/sumar-stock`, { cantidad });

      if (data && data.stock != null) {
        setItems((prev) =>
          prev.map((x) =>
            (x.id_producto ?? x.id ?? x.producto_id) === id
              ? { ...x, stock: data.stock }
              : x
          )
        );
      } else {
        await fetchAll();
      }
    } catch (e) {
      console.error(e);
      setErr("No se pudo sumar stock al producto");
    }
  }

  const filtered = useMemo(() => {
    const nq = normalize(q);

    return items
      .filter((p) => {
        const activo = Number(p.activo) === 1;

        if (showInactivos) {
          if (activo) return false;
        } else {
          if (!activo) return false;
        }

        const nombre = normalize(p.nombre);
        return nq === "" || nombre.includes(nq);
      })
      .sort((a, b) => normalize(a.nombre).localeCompare(normalize(b.nombre)));
  }, [items, q, showInactivos]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;

  return (
    <div>
      <h1>Productos</h1>

      <div style={{ marginBottom: 10 }}>
        <Link to="/productos/nuevo">+ Nuevo producto</Link>{" "}
        |{" "}
        <button type="button" onClick={fetchAll}>
          Recargar
        </button>
      </div>

      <fieldset style={{ marginBottom: 10 }}>
        <legend>Filtros</legend>

        <div style={{ marginBottom: 6 }}>
          <label>
            Buscar por nombre{" "}
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: crema"
            />
          </label>
        </div>

        <label>
          <input
            type="checkbox"
            checked={showInactivos}
            onChange={(e) => setShowInactivos(e.target.checked)}
          />{" "}
          Mostrar productos inactivos
        </label>
      </fieldset>

      {filtered.length === 0 ? (
        <p>
          {showInactivos ? "No hay productos inactivos." : "No hay productos activos."}
        </p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => {
              const id = p.id_producto ?? p.id ?? p.producto_id;
              const precio = p.precio ?? p.precio_unitario ?? p.precio_base ?? "-";
              const isActivo = Number(p.activo) === 1;

              return (
                <tr key={id ?? `${p.nombre}-${Math.random()}`}>
                  <td>{p.nombre ?? "-"}</td>
                  <td>{precio !== "-" ? moneyCLP(precio) : "-"}</td>
                  <td>{p.stock ?? "-"}</td>
                  <td>{isActivo ? "sí" : "no"}</td>
                  <td>
                    {id ? (
                      <>
                        <Link to={`/productos/${id}`}>Ver detalle</Link>{" "}
                        | <Link to={`/productos/${id}/editar`}>Editar</Link>{" "}
                        |{" "}
                        <button type="button" onClick={() => toggleActivo(p)}>
                          {isActivo ? "Desactivar" : "Activar"}
                        </button>
                        {" | "}
                        <button
                          type="button"
                          onClick={() => sumarStock(p)}
                          disabled={!isActivo}
                          title={!isActivo ? "Activa el producto para sumar stock" : ""}
                        >
                          + Stock
                        </button>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
