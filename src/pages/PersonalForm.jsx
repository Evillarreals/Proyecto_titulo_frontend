import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";
import "../App.css";

export default function PersonalForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    direccion: "",
    telefono: "",
    email: "",
  });

  const [rolesSelected, setRolesSelected] = useState([]);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await http.get("/roles");
        if (!mounted) return;
        setRoles(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.response?.data?.message || "No se pudieron cargar los roles");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, []);

  const rolesById = useMemo(() => {
    const m = new Map();
    roles.forEach((r) => m.set(Number(r.id_rol), r));
    return m;
  }, [roles]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toggleRole(idRol) {
    const id = Number(idRol);
    setRolesSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function validate() {
    const missing = [];
    if (!form.nombre.trim()) missing.push("nombre");
    if (!form.apellido.trim()) missing.push("apellido");
    if (!form.rut.trim()) missing.push("rut");
    if (!form.telefono.trim()) missing.push("telefono");
    if (!form.email.trim()) missing.push("email");
    if (rolesSelected.length === 0) missing.push("roles");

    return missing.length
      ? `Faltan campos obligatorios: ${missing.join(", ")}`
      : "";
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
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      rut: form.rut.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      roles: rolesSelected,
    };

    try {
      const res = await http.post("/personal", payload);

      const data = res?.data || {};
      setCreated({
        id_personal: data.id_personal,
        email: payload.email,
        password_temporal: data.password_temporal,
        must_change_password: data.must_change_password,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "No se pudo registrar el personal"
      );
    }
  }

  async function copyTempPassword() {
    if (!created?.password_temporal) return;
    try {
      await navigator.clipboard.writeText(created.password_temporal);
      alert("Clave temporal copiada.");
    } catch {
      alert("No se pudo copiar automáticamente.");
    }
  }

  function resetForm() {
    setCreated(null);
    setError("");
    setForm({
      nombre: "",
      apellido: "",
      rut: "",
      direccion: "",
      telefono: "",
      email: "",
    });
    setRolesSelected([]);
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
        <h2 className="form-title">Nuevo personal</h2>

        {error && <p className="helper-error">{error}</p>}

        {created && (
          <div className="created-box">
            <h3>Personal creado</h3>

            <p>
              <strong>ID:</strong> {created.id_personal ?? "-"}
              <br />
              <strong>Email:</strong> {created.email}
              <br />
              <strong>Clave temporal:</strong>{" "}
              <code>{created.password_temporal ?? "(no recibida)"}</code>
            </p>

            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={copyTempPassword}
                disabled={!created.password_temporal}
              >
                Copiar clave
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate("/personal")}
              >
                Ir al listado
              </button>

              <button type="button" className="btn" onClick={resetForm}>
                Crear otro
              </button>
            </div>

            <p style={{ marginTop: 10 }}>
              El usuario deberá cambiar esta clave al iniciar sesión.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={!!created} style={{ border: "none", padding: 0 }}>
            <h3 style={{ textAlign: "center" }}>Datos personales</h3>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={onChange} />
              </div>

              <div className="form-field">
                <label>Apellido</label>
                <input name="apellido" value={form.apellido} onChange={onChange} />
              </div>
            </div>

            <div className="form-field">
              <label>RUT</label>
              <input name="rut" value={form.rut} onChange={onChange} />
            </div>

            <div className="form-field">
              <label>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={onChange} />
            </div>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={onChange} />
              </div>

              <div className="form-field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                />
              </div>
            </div>

            <h3 style={{ textAlign: "center", marginTop: 12 }}>
              Roles del personal
            </h3>

            <div className="roles-grid">
              {roles.length === 0 ? (
                <p>No hay roles cargados.</p>
              ) : (
                roles.map((r) => {
                  const id = Number(r.id_rol);
                  const checked = rolesSelected.includes(id);

                  return (
                    <label key={id} className="role-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRole(id)}
                      />
                      {rolesById.get(id)?.nombre ?? r.nombre}
                    </label>
                  );
                })
              )}
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn primary"
                disabled={!!created}
              >
                Registrar personal
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => navigate(-1)}
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
