import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

export default function ProductoForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    marca: "",
    precio: "",
    stock: "",
    stock_minimo: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const nombreOk = form.nombre.trim().length > 0;
    const precioOk = Number(form.precio) > 0;
    const stockOk = Number.isFinite(Number(form.stock)) && Number(form.stock) >= 0;
    const stockMinOk =
      Number.isFinite(Number(form.stock_minimo)) && Number(form.stock_minimo) >= 0;

    return nombreOk && precioOk && stockOk && stockMinOk;
  }, [form]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Completa: nombre, precio (>0), stock y stock mínimo (>=0).");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      marca: form.marca.trim() || null,
      precio: Number(form.precio),
      stock: Number(form.stock),
      stock_minimo: Number(form.stock_minimo),
    };

    try {
      setSaving(true);
      await http.post("/productos", payload);
      navigate("/productos");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo registrar el producto";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Nuevo producto</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving} style={{ maxWidth: 520 }}>
          <div>
            <label>
              Nombre<br />
              <input name="nombre" value={form.nombre} onChange={onChange} />
            </label>
          </div>

          <div>
            <label>
              Marca (opcional)<br />
              <input name="marca" value={form.marca} onChange={onChange} />
            </label>
          </div>

          <div>
            <label>
              Precio<br />
              <input
                name="precio"
                type="number"
                min="0"
                step="1"
                value={form.precio}
                onChange={onChange}
              />
            </label>
          </div>

          <div>
            <label>
              Stock<br />
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={onChange}
              />
            </label>
          </div>

          <div>
            <label>
              Stock mínimo<br />
              <input
                name="stock_minimo"
                type="number"
                min="0"
                step="1"
                value={form.stock_minimo}
                onChange={onChange}
              />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={!canSubmit || saving}>
              {saving ? "Registrando..." : "Registrar producto"}
            </button>{" "}
            <button type="button" onClick={() => navigate(-1)} disabled={saving}>
              Volver
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
