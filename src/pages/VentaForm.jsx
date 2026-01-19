import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../auth/AuthContext";

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
    return productos.find((p) => String(p.id_producto) === String(id));
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

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.id_producto) return `Item ${i + 1}: falta producto.`;
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

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Nueva venta</h1>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

      {warnings.length > 0 && (
        <div style={{ border: "1px solid #f00", padding: 10, marginBottom: 10 }}>
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

      <form onSubmit={onSubmit}>
        <fieldset disabled={submitting}>
          <div>
            <label>Clienta</label>
            <br />
            <select value={idClienta} onChange={(e) => setIdClienta(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {clientas.map((c) => (
                <option key={c.id_clienta} value={c.id_clienta}>
                  {c.nombre} {c.apellido} (#{c.id_clienta})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Vendedora</label>
            <br />
            <select value={idVendedora} onChange={(e) => setIdVendedora(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {vendedoras.map((p) => (
                <option key={p.id_personal} value={p.id_personal}>
                  {p.nombre} {p.apellido} (#{p.id_personal})
                </option>
              ))}
            </select>
          </div>

          <hr />

          <h3>Productos</h3>

          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div>
                <label>Producto</label>
                <br />
                <select value={it.id_producto} onChange={(e) => onChangeProducto(idx, e.target.value)}>
                  <option value="">-- Seleccionar --</option>
                  {productos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} ({p.marca}) - ${p.precio} | stock: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Cantidad</label>
                <br />
                <input
                  type="number"
                  min="1"
                  value={it.cantidad}
                  onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                />
              </div>

              <div>
                <label>Precio unitario</label>
                <br />
                <input
                  type="number"
                  min="1"
                  value={it.precio_unitario}
                  onChange={(e) => updateItem(idx, { precio_unitario: e.target.value })}
                />
              </div>

              <div>
                <strong>Subtotal:</strong> ${Number(it.cantidad || 0) * Number(it.precio_unitario || 0)}
              </div>

              {items.length > 1 ? (
                <button type="button" onClick={() => removeItem(idx)}>
                  Quitar item
                </button>
              ) : null}

              <hr />
            </div>
          ))}

          <button type="button" onClick={addItem}>
            + Agregar producto
          </button>

          <p>
            <strong>Total:</strong> ${total}
          </p>

          <button type="submit">{submitting ? "Guardando..." : "Registrar venta"}</button>
          <button type="button" onClick={() => navigate("/dashboard")} style={{ marginLeft: 8 }}>
            Volver
          </button>
        </fieldset>
      </form>
    </div>
  );
}
