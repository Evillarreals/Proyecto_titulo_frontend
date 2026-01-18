import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

export default function ProductoEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    marca: "",
    precio: "",
    stock: "",
    stock_minimo: "",
  });

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/productos/${id}`);
      // soporta: plano o { producto } o { data }
      const p = res.data?.producto ?? res.data?.data ?? res.data;

      setForm({
        nombre: p?.nombre ?? "",
        marca: p?.marca ?? "",
        precio: p?.precio ?? "",
        stock: p?.stock ?? "",
        stock_minimo: p?.stock_minimo ?? "",
      });
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el producto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function validate() {
    if (!form.nombre.trim()) return "Nombre es obligatorio";
    if (!form.marca.trim()) return "Marca es obligatoria";

    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio <= 0) return "Precio inválido (debe ser > 0)";

    const stock = Number(form.stock);
    if (!Number.isFinite(stock) || stock < 0) return "Stock inválido (debe ser >= 0)";

    const stockMin = Number(form.stock_minimo);
    if (!Number.isFinite(stockMin) || stockMin < 0)
      return "Stock mínimo inválido (debe ser >= 0)";

    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }

    try {
      setSaving(true);

      await http.put(`/productos/${id}`, {
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        precio: Number(form.precio),
        stock: Number(form.stock),
        stock_minimo: Number(form.stock_minimo),
      });

      navigate(`/productos/${id}`);
    } catch (e2) {
      console.error(e2);
      setErr(e2?.response?.data?.message || "No se pudo actualizar el producto");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Editar producto</h1>

      <div style={{ marginBottom: 10 }}>
        <Link to={`/productos/${id}`}>Volver al detalle</Link>{" "}
        |{" "}
        <button type="button" onClick={fetchOne} disabled={saving}>
          Recargar
        </button>
      </div>

      {err ? <p style={{ color: "crimson" }}>{err}</p> : null}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving}>
          <div>
            <label>Nombre</label>
            <br />
            <input value={form.nombre} onChange={(e) => setField("nombre", e.target.value)} />
          </div>

          <div>
            <label>Marca</label>
            <br />
            <input value={form.marca} onChange={(e) => setField("marca", e.target.value)} />
          </div>

          <div>
            <label>Precio</label>
            <br />
            <input
              type="number"
              min="1"
              value={form.precio}
              onChange={(e) => setField("precio", e.target.value)}
            />
          </div>

          <div>
            <label>Stock</label>
            <br />
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setField("stock", e.target.value)}
            />
          </div>

          <div>
            <label>Stock mínimo</label>
            <br />
            <input
              type="number"
              min="0"
              value={form.stock_minimo}
              onChange={(e) => setField("stock_minimo", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="submit">{saving ? "Guardando..." : "Guardar cambios"}</button>{" "}
            <button type="button" onClick={() => navigate(-1)}>
              Cancelar
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
