import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

export default function VentaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [clientas, setClientas] = useState([]);
  const [productos, setProductos] = useState([]);

  const [idCliente, setIdCliente] = useState("");
  const [items, setItems] = useState([
    { id_producto: "", cantidad: 1, precio_unitario: 0 },
  ]);

  // --- helpers ---
  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
  }

  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const cant = Number(it.cantidad || 0);
      const pu = Number(it.precio_unitario || 0);
      return acc + cant * pu;
    }, 0);
  }, [items]);

  function subtotalOf(it) {
    const cant = Number(it.cantidad || 0);
    const pu = Number(it.precio_unitario || 0);
    return cant * pu;
  }

  function setItem(idx, patch) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { id_producto: "", cantidad: 1, precio_unitario: 0 }]);
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // Cargar: clientas + productos + venta
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setOkMsg("");

        const [resClientas, resProductos, resVenta] = await Promise.all([
          http.get("/clientas"),
          http.get("/productos"),
          http.get(`/ventas/${id}`),
        ]);

        if (!mounted) return;

        setClientas(resClientas.data || []);
        setProductos(resProductos.data || []);

        // backend puede devolver plano o con wrapper (por si acaso)
        const v = resVenta.data?.venta ?? resVenta.data;

        // id_cliente / items según tu backend de ventas/:id
        setIdCliente(String(v?.id_cliente ?? ""));

        const loadedItems = Array.isArray(v?.items) ? v.items : [];
        if (loadedItems.length > 0) {
          setItems(
            loadedItems.map((it) => ({
              id_producto: String(it.id_producto ?? ""),
              cantidad: Number(it.cantidad ?? 1),
              precio_unitario: Number(it.precio_unitario ?? 0),
            }))
          );
        } else {
          setItems([{ id_producto: "", cantidad: 1, precio_unitario: 0 }]);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.message || "Error cargando datos para editar venta");
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Cuando selecciona un producto: autocompletar precio_unitario desde producto.precio (si existe)
  function onSelectProducto(idx, idProd) {
    const prod = productos.find((p) => String(p.id_producto) === String(idProd));
    const precioSugerido =
      prod?.precio_unitario ?? prod?.precio ?? prod?.precio_venta ?? prod?.precio_base;

    setItem(idx, {
      id_producto: String(idProd),
      precio_unitario: precioSugerido != null ? Number(precioSugerido) : 0,
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    // Validaciones mínimas
    if (!idCliente) return setError("Debes seleccionar una clienta");
    if (!items.length) return setError("Debes agregar al menos 1 producto");

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.id_producto) return setError(`Falta seleccionar producto en ítem #${i + 1}`);
      if (!Number.isFinite(Number(it.cantidad)) || Number(it.cantidad) <= 0)
        return setError(`Cantidad inválida en ítem #${i + 1}`);
      if (!Number.isFinite(Number(it.precio_unitario)) || Number(it.precio_unitario) <= 0)
        return setError(`Precio unitario inválido en ítem #${i + 1}`);
    }

    if (total <= 0) return setError("El total debe ser mayor a 0");

    try {
      setSaving(true);

      const payload = {
        id_cliente: Number(idCliente),
        items: items.map((it) => ({
          id_producto: Number(it.id_producto),
          cantidad: Number(it.cantidad),
          precio_unitario: Number(it.precio_unitario),
        })),
      };

      // Endpoint esperado: PUT /ventas/:id
      await http.put(`/ventas/${id}`, payload);

      setOkMsg("Venta actualizada");
      // vuelve al detalle
      navigate(`/ventas/${id}`);
    } catch (e) {
      setError(e?.response?.data?.message || "Error al actualizar venta");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Editar venta</h1>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}
      {okMsg ? <p style={{ color: "green" }}>{okMsg}</p> : null}

      <form onSubmit={onSubmit}>
        <fieldset>
          <legend>Cliente</legend>

          <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)}>
            <option value="">-- Seleccionar --</option>
            {clientas.map((c) => (
              <option key={c.id_clienta} value={c.id_clienta}>
                {c.nombre} {c.apellido} (#{c.id_clienta})
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset style={{ marginTop: 12 }}>
          <legend>Productos</legend>

          {items.map((it, idx) => (
            <div key={idx} style={{ borderTop: "1px solid #ccc", paddingTop: 10, marginTop: 10 }}>
              <div>
                <label>Producto</label>
                <br />
                <select
                  value={it.id_producto}
                  onChange={(e) => onSelectProducto(idx, e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {productos.map((p) => (
                    <option key={p.id_producto} value={p.id_producto}>
                      {p.nombre} - {money(p.precio_unitario ?? p.precio ?? p.precio_venta ?? 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Cantidad</label>
                <br />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={it.cantidad}
                  onChange={(e) => setItem(idx, { cantidad: Number(e.target.value) })}
                />
              </div>

              <div>
                <label>Precio unitario</label>
                <br />
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={it.precio_unitario}
                  onChange={(e) => setItem(idx, { precio_unitario: Number(e.target.value) })}
                />
              </div>

              <p>
                <strong>Subtotal:</strong> {money(subtotalOf(it))}
              </p>

              {items.length > 1 ? (
                <button type="button" onClick={() => removeItem(idx)}>
                  Quitar item
                </button>
              ) : null}
            </div>
          ))}

          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={addItem}>
              + Agregar producto
            </button>
          </div>

          <p style={{ marginTop: 10 }}>
            <strong>Total:</strong> {money(total)}
          </p>
        </fieldset>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>{" "}
          <Link to={`/ventas/${id}`}>Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
