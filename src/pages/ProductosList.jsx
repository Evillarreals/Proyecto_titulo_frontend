import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";
import "../App.css";

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

  return (
    <div className="page-center">
      <div className="list-card">
        <div className="list-header">
          <h2 className="list-title">Productos</h2>

          <div className="list-header-actions">
            <Link to="/productos/nuevo" className="btn primary">
              Nuevo Producto
            </Link>

            <button type="button" className="btn" onClick={fetchAll}>
              Recargar
            </button>
          </div>
        </div>

        <div className="filters-card">
          <h3 className="filters-title">Filtros</h3>

          <div className="form-field">
            <label>Buscar por nombre</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ej: crema"
            />
          </div>

          <label className="role-check" style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={showInactivos}
              onChange={(e) => setShowInactivos(e.target.checked)}
            />
            Mostrar productos inactivos
          </label>
        </div>

        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: 10 }}>
            {showInactivos ? "No hay productos inactivos." : "No hay productos activos."}
          </p>
        ) : (
          <div className={`cards-grid ${filtered.length % 2 === 1 ? "odd" : ""}`} style={{ marginTop: 14 }}>
            {filtered.map((p) => {
              const id = p.id_producto ?? p.id ?? p.producto_id;
              const precio = p.precio ?? p.precio_unitario ?? p.precio_base ?? "-";
              const isActivo = Number(p.activo) === 1;

              return (
                <div key={id ?? `${p.nombre}-${Math.random()}`} className="list-item-card">
                  <div className="card-top">
                    <div className="card-title">{p.nombre ?? "-"}</div>
                    <div className="card-sub">{isActivo ? "Activo" : "Inactivo"}</div>
                  </div>

                  <div className="card-mid" style={{ justifyContent: "flex-start" }}>
                    <div className="card-line">
                      <span className="muted">Precio:</span>{" "}
                      <strong>{precio !== "-" ? moneyCLP(precio) : "-"}</strong>
                    </div>

                    <div className="card-line">
                      <span className="muted">Stock:</span>{" "}
                      <strong>{p.stock ?? "-"}</strong>
                    </div>

                    <div className="chips" style={{ marginTop: 6 }}>
                      <span className={`chip ${isActivo ? "ok" : "danger"}`}>
                        {isActivo ? "activo" : "inactivo"}
                      </span>

                      {Number(p.stock ?? 0) <= Number(p.stock_minimo ?? -1) && isActivo ? (
                        <span className="chip danger">stock bajo</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="card-actions">
                    {id ? (
                      <>
                        <Link to={`/productos/${id}`} className="btn">
                          Ver Detalle
                        </Link>

                        <Link to={`/productos/${id}/editar`} className="btn">
                          Editar
                        </Link>

                        <button type="button" className="btn" onClick={() => toggleActivo(p)}>
                          {isActivo ? "Desactivar" : "Activar"}
                        </button>

                        <button
                          type="button"
                          className="btn"
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
