import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import "../App.css";

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
      const p = res.data?.producto ?? res.data?.data ?? res.data;

      setForm({
        nombre: p?.nombre ?? "",
        marca: p?.marca ?? "",
        precio: p?.precio ?? "",
        stock: p?.stock ?? "",
        stock_minimo: p?.stock_minimo ?? "",
      });
    } catch (e) {
      setErr("No se pudo cargar el producto");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
  }, [id]);

  function validate() {
    if (!form.nombre.trim()) return "Nombre es obligatorio";
    if (!form.marca.trim()) return "Marca es obligatoria";

    const precio = Number(form.precio);
    if (!Number.isFinite(precio) || precio <= 0)
      return "Precio inválido (debe ser mayor a 0)";

    const stock = Number(form.stock);
    if (!Number.isFinite(stock) || stock < 0)
      return "Stock inválido (debe ser mayor o igual a 0)";

    const stockMin = Number(form.stock_minimo);
    if (!Number.isFinite(stockMin) || stockMin < 0)
      return "Stock mínimo inválido (debe ser mayor o igual a 0)";

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
      setErr(e2?.response?.data?.message || "No se pudo actualizar el producto");
    } finally {
      setSaving(false);
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
        <h2 className="form-title">Editar producto</h2>

        {/* acciones superiores */}
        <div className="form-actions" style={{ marginBottom: 18 }}>
          <Link to={`/productos/${id}`} className="btn">
            Volver al detalle
          </Link>

          <button
            type="button"
            className="btn"
            onClick={fetchOne}
            disabled={saving}
          >
            Recargar
          </button>
        </div>

        {err && <p className="helper-error">{err}</p>}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={saving} style={{ border: "none", padding: 0 }}>
            <div className="form-field">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Marca</label>
              <input
                value={form.marca}
                onChange={(e) => setField("marca", e.target.value)}
              />
            </div>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Precio</label>
                <input
                  type="number"
                  min="1"
                  value={form.precio}
                  onChange={(e) => setField("precio", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Stock</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Stock mínimo</label>
              <input
                type="number"
                min="0"
                value={form.stock_minimo}
                onChange={(e) => setField("stock_minimo", e.target.value)}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
