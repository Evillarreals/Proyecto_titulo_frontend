import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../auth/AuthContext";

function moneyCLP(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("es-CL", { style: "currency", currency: "CLP" });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function datetimeLocalToSql(dtLocal) {
  if (!dtLocal) return "";
  const [date, time] = dtLocal.split("T");
  if (!date || !time) return "";
  return `${date} ${time}:00`;
}

function toDatetimeLocalValue(value) {
  if (!value) return "";
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function normalizeRole(r) {
  if (!r) return "";
  if (typeof r === "string") return r.toLowerCase();
  if (typeof r === "object") {
    if (r.nombre) return String(r.nombre).toLowerCase();
    if (r.rol) return String(r.rol).toLowerCase();
  }
  return String(r).toLowerCase();
}

export default function AtencionesEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  const isAdmin = roles.includes("administradora");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [clientas, setClientas] = useState([]);
  const [serviciosCatalogo, setServiciosCatalogo] = useState([]);
  const [personalCatalogo, setPersonalCatalogo] = useState([]);

  const [idClienta, setIdClienta] = useState("");
  const [idPersonal, setIdPersonal] = useState("");
  const [fechaInicioLocal, setFechaInicioLocal] = useState("");
  const [trasladoMin, setTrasladoMin] = useState(0);

  const [items, setItems] = useState([{ id_servicio: "", precio_aplicado: "" }]);

  const total = useMemo(() => {
    return items.reduce((acc, it) => acc + Number(it.precio_aplicado || 0), 0);
  }, [items]);

  function addItem() {
    setItems((prev) => [...prev, { id_servicio: "", precio_aplicado: "" }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index, patch) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  }

  function onChangeServicio(index, idServicio) {
    const srv = serviciosCatalogo.find(
      (s) => String(s.id_servicio) === String(idServicio)
    );

    updateItem(index, {
      id_servicio: idServicio,
      precio_aplicado: srv?.precio_base != null ? Number(srv.precio_base) : "",
    });
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    setOkMsg("");

    try {
      const reqPersonal = isAdmin ? http.get("/personal") : Promise.resolve({ data: [] });

      const [resClientas, resServicios, resAt, resPersonal] = await Promise.all([
        http.get("/clientas"),
        http.get("/servicios"),
        http.get(`/atenciones/${id}`),
        reqPersonal,
      ]);

      setClientas(Array.isArray(resClientas.data) ? resClientas.data : []);
      setServiciosCatalogo(Array.isArray(resServicios.data) ? resServicios.data : []);

      const personalArr = Array.isArray(resPersonal.data) ? resPersonal.data : [];
      setPersonalCatalogo(personalArr);

      const at = resAt.data?.atencion ?? null;
      const detServicios = Array.isArray(resAt.data?.servicios) ? resAt.data.servicios : [];

      if (!at) {
        setError("No se encontró la atención.");
        setLoading(false);
        return;
      }

      setIdClienta(String(at.id_clienta ?? ""));
      setFechaInicioLocal(toDatetimeLocalValue(at.fecha_inicio));
      setTrasladoMin(Number(at.traslado_min ?? 0));

      setIdPersonal(String(at.id_personal ?? ""));

      if (detServicios.length > 0) {
        setItems(
          detServicios.map((s) => ({
            id_servicio: String(s.id_servicio ?? ""),
            precio_aplicado: Number(s.precio_aplicado ?? 0),
          }))
        );
      } else {
        setItems([{ id_servicio: "", precio_aplicado: "" }]);
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Error cargando datos de la atención.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  function validate() {
    if (!idClienta) return "Debes seleccionar una clienta.";
    if (!fechaInicioLocal) return "Debes seleccionar fecha y hora de inicio.";
    if (!Number.isFinite(Number(trasladoMin)) || Number(trasladoMin) < 0)
      return "Traslado (min) inválido.";

    if (isAdmin && !idPersonal)
      return "Campos obligatorios: id_personal (cuando el rol es administradora)";

    if (!items.length) return "Debes agregar al menos 1 servicio.";

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.id_servicio) return `Servicio ${i + 1}: falta seleccionar servicio.`;
      const p = Number(it.precio_aplicado);
      if (!Number.isFinite(p) || p <= 0)
        return `Servicio ${i + 1}: precio aplicado inválido.`;
    }

    if (total <= 0) return "El total debe ser mayor a 0.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      id_clienta: Number(idClienta),
      fecha_inicio: datetimeLocalToSql(fechaInicioLocal),
      traslado_min: Number(trasladoMin || 0),
      servicios: items.map((it) => ({
        id_servicio: Number(it.id_servicio),
        precio_aplicado: Number(it.precio_aplicado),
      })),
      ...(isAdmin ? { id_personal: Number(idPersonal) } : {}),
    };

    try {
      setSaving(true);
      await http.put(`/atenciones/${id}`, payload);
      setOkMsg("Atención actualizada");
      navigate(`/atenciones/${id}`);
    } catch (e2) {
      console.error(e2);
      setError(
        e2?.response?.data?.message ||
          "No se pudo actualizar la atención (revisa conflicto de agenda)."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Editar atención</h1>

      <div style={{ marginBottom: 10 }}>
        <Link to={`/atenciones/${id}`}>Volver al detalle</Link> |{" "}
        <button type="button" onClick={loadAll} disabled={saving}>
          Recargar
        </button>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {okMsg ? <p style={{ color: "green" }}>{okMsg}</p> : null}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving}>
          <h3>Datos generales</h3>

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

          {isAdmin ? (
            <div style={{ marginTop: 10 }}>
              <label>Masoterapeuta (personal)</label>
              <br />
              <select value={idPersonal} onChange={(e) => setIdPersonal(e.target.value)}>
                <option value="">-- Seleccionar --</option>
                {personalCatalogo.map((p) => (
                  <option key={p.id_personal} value={p.id_personal}>
                    {p.nombre} {p.apellido} (#{p.id_personal})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div style={{ marginTop: 10 }}>
            <label>Fecha / hora inicio</label>
            <br />
            <input
              type="datetime-local"
              value={fechaInicioLocal}
              onChange={(e) => setFechaInicioLocal(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Traslado (min)</label>
            <br />
            <input
              type="number"
              min="0"
              step="1"
              value={trasladoMin}
              onChange={(e) => setTrasladoMin(e.target.value)}
            />
          </div>

          <hr />

          <h3>Servicios</h3>

          {items.map((it, idx) => (
            <div key={idx} style={{ marginBottom: 12 }}>
              <div>
                <label>Servicio</label>
                <br />
                <select
                  value={it.id_servicio}
                  onChange={(e) => onChangeServicio(idx, e.target.value)}
                >
                  <option value="">-- Seleccionar --</option>
                  {serviciosCatalogo.map((s) => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre} - {moneyCLP(s.precio_base)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Precio aplicado</label>
                <br />
                <input
                  type="number"
                  min="1"
                  value={it.precio_aplicado}
                  onChange={(e) =>
                    updateItem(idx, { precio_aplicado: e.target.value })
                  }
                />
              </div>

              <div>
                <strong>Subtotal:</strong> {moneyCLP(it.precio_aplicado)}
              </div>

              {items.length > 1 ? (
                <button type="button" onClick={() => removeItem(idx)}>
                  Quitar servicio
                </button>
              ) : null}

              <hr />
            </div>
          ))}

          <button type="button" onClick={addItem}>
            + Agregar servicio
          </button>

          <p>
            <strong>Total:</strong> {moneyCLP(total)}
          </p>

          <button type="submit">{saving ? "Guardando..." : "Guardar cambios"}</button>
        </fieldset>
      </form>
    </div>
  );
}
