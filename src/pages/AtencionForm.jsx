import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../auth/AuthContext";

export default function AtencionForm() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [clientas, setClientas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [masoterapeutas, setMasoterapeutas] = useState([]);

  const [idClienta, setIdClienta] = useState("");
  const [idMasoterapeuta, setIdMasoterapeuta] = useState(() =>
    user?.id_personal != null ? String(user.id_personal) : ""
  );

  const [fechaInicio, setFechaInicio] = useState("");
  const [trasladoMin, setTrasladoMin] = useState(0);

  const [items, setItems] = useState([{ id_servicio: "", precio_unitario: "" }]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [resClientas, resServicios] = await Promise.all([
          http.get("/clientas"),
          http.get("/servicios"),
        ]);

        if (!alive) return;

        setClientas(Array.isArray(resClientas.data) ? resClientas.data : []);
        setServicios(Array.isArray(resServicios.data) ? resServicios.data : []);

        try {
          const resPersonal = await http.get("/personal");
          const all = Array.isArray(resPersonal.data) ? resPersonal.data : [];

          const lista = all.filter((p) => {
            const activo = p.activo === 1 || p.activo === true || p.activo === "1";
            const roles = Array.isArray(p.roles) ? p.roles : [];
            const esMasoterapeuta = roles.some(
              (r) => String(r?.nombre).toLowerCase() === "masoterapeuta"
            );
            return activo && esMasoterapeuta;
          });

          setMasoterapeutas(lista);

          if (!idMasoterapeuta) {
            const found = lista.find((p) => String(p.id_personal) === String(user?.id_personal));
            if (found) setIdMasoterapeuta(String(found.id_personal));
            else if (lista.length > 0) setIdMasoterapeuta(String(lista[0].id_personal));
          }
        } catch {
          if (user?.id_personal) {
            setMasoterapeutas([
              {
                id_personal: user.id_personal,
                nombre: user.nombre || "Usuario",
                apellido: user.apellido || "",
                activo: 1,
                roles: [{ nombre: "masoterapeuta" }],
              },
            ]);
            if (!idMasoterapeuta) setIdMasoterapeuta(String(user.id_personal));
          } else {
            setMasoterapeutas([]);
          }
        }
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || "No se pudieron cargar clientas/servicios.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  function getServicioById(id) {
    return servicios.find((s) => String(s.id_servicio) === String(id));
  }

  function addItem() {
    setItems((prev) => [...prev, { id_servicio: "", precio_unitario: "" }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index, patch) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function onChangeServicio(index, idServ) {
    const serv = getServicioById(idServ);

    const precioSugerido =
      serv?.precio_base != null ? Number(serv.precio_base)
      : serv?.precio != null ? Number(serv.precio)
      : "";

    updateItem(index, {
      id_servicio: idServ,
      precio_unitario: precioSugerido,
    });
  }

  function toBackendDateTime(dtLocal) {
    if (!dtLocal) return "";
    if (dtLocal.includes(" ")) return dtLocal;
    return dtLocal.replace("T", " ") + ":00";
  }

  const total = useMemo(() => {
    return items.reduce((acc, it) => {
      const n = parseFloat(String(it.precio_unitario ?? "").replace(",", "."));
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [items]);

  function validate() {
    if (!idClienta) return "Debes seleccionar una clienta.";
    if (!fechaInicio) return "Debes seleccionar la fecha y hora de inicio.";
    if (!idMasoterapeuta) return "Debes seleccionar una masoterapeuta.";
    if (!items.length) return "Debes agregar al menos 1 servicio.";

    const t = Number(trasladoMin);
    if (!Number.isFinite(t) || t < 0) return "Traslado (min) inválido.";

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.id_servicio) return `Item ${i + 1}: falta servicio.`;
      const n = parseFloat(String(it.precio_unitario ?? "").replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) return `Item ${i + 1}: precio inválido.`;
    }

    if (total <= 0) return "El total debe ser mayor a 0.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      id_clienta: Number(idClienta),
      id_personal: Number(idMasoterapeuta),
      fecha_inicio: toBackendDateTime(fechaInicio),
      traslado_min: Number(trasladoMin || 0),

      servicios: items.map((it) => {
        const precio = Number(String(it.precio_unitario ?? "").replace(",", "."));
        return {
          id_servicio: Number(it.id_servicio),
          precio_aplicado: precio,
        };
      }),
    };

    try {
      setSubmitting(true);
      const res = await http.post("/atenciones", payload);

      const idAtencion = res?.data?.id_atencion;
      if (idAtencion) navigate(`/atenciones/${idAtencion}`);
      else navigate("/atenciones");
    } catch (e2) {
      setError(e2?.response?.data?.message || "No se pudo registrar la atención.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Nueva atención</h1>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}

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
            <label>Masoterapeuta</label>
            <br />
            <select value={idMasoterapeuta} onChange={(e) => setIdMasoterapeuta(e.target.value)}>
              <option value="">-- Seleccionar --</option>
              {masoterapeutas.map((p) => (
                <option key={p.id_personal} value={p.id_personal}>
                  {p.nombre} {p.apellido} (#{p.id_personal})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Fecha y hora de inicio</label>
            <br />
            <input
              type="datetime-local"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label>Traslado (min)</label>
            <br />
            <input
              type="number"
              min="0"
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
                  {servicios.map((s) => {
                    const precioLabel =
                      s.precio_base != null ? s.precio_base : (s.precio != null ? s.precio : "");
                    return (
                      <option key={s.id_servicio} value={s.id_servicio}>
                        {s.nombre} - ${precioLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label>Precio</label>
                <br />
                <input
                  type="number"
                  min="1"
                  value={it.precio_unitario}
                  onChange={(e) => updateItem(idx, { precio_unitario: e.target.value })}
                />
              </div>

              <div>
                <strong>Subtotal:</strong> ${Number(it.precio_unitario || 0)}
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
            + Agregar servicio
          </button>

          <p>
            <strong>Total:</strong> ${total}
          </p>

          <button type="submit">{submitting ? "Guardando..." : "Registrar atención"}</button>
          <button type="button" onClick={() => navigate("/")} style={{ marginLeft: 8 }}>
            Volver
          </button>
        </fieldset>
      </form>
    </div>
  );
}
