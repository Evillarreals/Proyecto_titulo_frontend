import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../auth/AuthContext";
import "../App.css";

export default function VentaForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clientas, setClientas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [vendedoras, setVendedoras] = useState([]);

  const [warnings, setWarnings] = useState([]);

  const [idClienta, setIdClienta] = useState("");
  const [idVendedora, setIdVendedora] = useState(() =>
    user?.id_personal != null ? String(user.id_personal) : ""
  );

  const [items, setItems] = useState([{ id_producto: "", cantidad: 1, precio_unitario: "" }]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isActivo = (x) => x?.activo === 1 || x?.activo === true || x?.activo === "1";
  const clientasActivas = useMemo(() => {
    return (Array.isArray(clientas) ? clientas : []).filter(isActivo);
  }, [clientas]);

  const productosActivos = useMemo(() => {
    return (Array.isArray(productos) ? productos : []).filter(isActivo);
  }, [productos]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [resClientas, resProductos] = await Promise.all([
          http.get("/clientas"),
          http.get("/productos"),
        ]);

        if (!alive) return;

        setClientas(Array.isArray(resClientas.data) ? resClientas.data : []);
        setProductos(Array.isArray(resProductos.data) ? resProductos.data : []);

        try {
          const resPersonal = await http.get("/personal");
          const all = Array.isArray(resPersonal.data) ? resPersonal.data : [];

          const vend = all.filter((p) => {
            const activo = p.activo === 1 || p.activo === true || p.activo === "1";
            const roles = Array.isArray(p.roles) ? p.roles : [];
            const esVendedora = roles.some((r) => String(r?.nombre).toLowerCase() === "vendedora");
            return activo && esVendedora;
          });

          setVendedoras(vend);

          if (!idVendedora) {
            const found = vend.find((p) => String(p.id_personal) === String(user?.id_personal));
            if (found) setIdVendedora(String(found.id_personal));
          }
        } catch {
          if (user?.id_personal) {
            setVendedoras([
              {
                id_personal: user.id_personal,
                nombre: user.nombre || "Usuario",
                apellido: user.apellido || "",
                activo: 1,
                roles: [{ nombre: "vendedora" }],
              },
            ]);
            if (!idVendedora) setIdVendedora(String(user.id_personal));
          } else {
            setVendedoras([]);
          }
        }
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || "No se pudieron cargar clientas/productos.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  function getProductoById(id) {
    return productosActivos.find((p) => String(p.id_producto) === String(id));
  }

  function addItem() {
    setItems((prev) => [...prev, { id_producto: "", cantidad: 1, precio_unitario: "" }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index, patch) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function onChangeProducto(index, idProd) {
    const prod = getProductoById(idProd);

    updateItem(index, {
      id_producto: idProd,
      precio_unitario: prod?.precio != null ? Number(prod.precio) : "",
    });
  }

  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const cant = Number(it.cantidad || 0);
      const pu = Number(it.precio_unitario || 0);
      return acc + cant * pu;
    }, 0);
  }, [items]);

  function validate() {
    if (!idClienta) return "Debes seleccionar una clienta.";
    if (!idVendedora) return "Debes seleccionar una vendedora.";
    if (!items.length) return "Debes agregar al menos 1 producto.";

    const clientaOk = clientasActivas.some((c) => String(c.id_clienta) === String(idClienta));
    if (!clientaOk) return "La clienta seleccionada está inactiva o no disponible.";

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.id_producto) return `Item ${i + 1}: falta producto.`;

      const prodOk = productosActivos.some(
        (p) => String(p.id_producto) === String(it.id_producto)
      );
      if (!prodOk) return `Item ${i + 1}: el producto seleccionado está inactivo o no disponible.`;

      if (!Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0)
        return `Item ${i + 1}: cantidad inválida.`;
      if (!Number.isFinite(Number(it.precio_unitario)) || Number(it.precio_unitario) <= 0)
        return `Item ${i + 1}: precio unitario inválido.`;
    }

    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setWarnings([]);

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      id_clienta: Number(idClienta),
      id_personal: Number(idVendedora),
      items: items.map((it) => ({
        id_producto: Number(it.id_producto),
        cantidad: Number(it.cantidad),
        precio_unitario: Number(it.precio_unitario),
      })),
    };

    try {
      setSubmitting(true);

      const res = await http.post("/ventas", payload);

      const w = Array.isArray(res?.data?.warnings) ? res.data.warnings : [];
      setWarnings(w);

      if (w.length > 0) {
        const msgWarn = w
          .map((x) => `- ${x.producto_nombre} (queda ${x.stock_actual}, mínimo ${x.stock_minimo})`)
          .join("\n");
        alert(`⚠️ Stock bajo en los siguientes productos:\n\n${msgWarn}`);
      }

      const idVenta = res?.data?.id_venta;
      if (idVenta) navigate(`/ventas/${idVenta}`);
      else navigate("/ventas");
    } catch (e2) {
      setError(e2?.response?.data?.message || "No se pudo registrar la venta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="page-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="page-center">
      <div className="form-card">
        <h2 className="form-title">Nueva venta</h2>

        {error ? <p className="helper-error">{error}</p> : null}

        {warnings.length > 0 && (
          <div className="warn-box">
            <strong>⚠️ Stock bajo:</strong>
            <ul>
              {warnings.map((w) => (
                <li key={w.id_producto}>
                  {w.producto_nombre} — queda {w.stock_actual} (mínimo {w.stock_minimo})
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={submitting} style={{ border: "none", padding: 0 }}>
            <div className="form-field">
              <label>Clienta</label>
              <select value={idClienta} onChange={(e) => setIdClienta(e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {clientasActivas.map((c) => (
                  <option key={c.id_clienta} value={c.id_clienta}>
                    {c.nombre} {c.apellido} (#{c.id_clienta})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Vendedora</label>
              <select value={idVendedora} onChange={(e) => setIdVendedora(e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {vendedoras.map((p) => (
                  <option key={p.id_personal} value={p.id_personal}>
                    {p.nombre} {p.apellido} (#{p.id_personal})
                  </option>
                ))}
              </select>
            </div>

            <h3 style={{ textAlign: "center", margin: "12px 0 6px" }}>Productos</h3>

            {items.map((it, idx) => {
              const subtotal = Number(it.cantidad || 0) * Number(it.precio_unitario || 0);

              return (
                <div key={idx} className="item-card">
                  <div className="form-field">
                    <label>Producto</label>
                    <select
                      value={it.id_producto}
                      onChange={(e) => onChangeProducto(idx, e.target.value)}
                    >
                      <option value="">-- Seleccionar --</option>
                      {productosActivos.map((p) => (
                        <option key={p.id_producto} value={p.id_producto}>
                          {p.nombre} ({p.marca}) - ${p.precio} | stock: {p.stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row two-cols">
                    <div className="form-field">
                      <label>Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={it.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                      />
                    </div>

                    <div className="form-field">
                      <label>Precio unitario</label>
                      <input
                        type="number"
                        min="1"
                        value={it.precio_unitario}
                        onChange={(e) => updateItem(idx, { precio_unitario: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Subtotal</label>
                    <div className="input-like">${subtotal}</div>
                  </div>

                  {items.length > 1 ? (
                    <div className="form-actions" style={{ marginTop: 10 }}>
                      <button type="button" className="btn" onClick={() => removeItem(idx)}>
                        Quitar producto
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className="form-actions" style={{ marginTop: 10 }}>
              <button type="button" className="btn" onClick={addItem}>
                Agregar producto
              </button>
            </div>

            <div className="total-box">
              <strong>Total:</strong> ${total}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={submitting}>
                {submitting ? "Guardando..." : "Registrar venta"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate("/dashboard")}
                disabled={submitting}
              >
                Volver
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
