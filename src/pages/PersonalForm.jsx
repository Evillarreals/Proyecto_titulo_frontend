import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

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

    return () => {
      mounted = false;
    };
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
    setRolesSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  function validate() {
    const missing = [];
    if (!form.nombre.trim()) missing.push("nombre");
    if (!form.apellido.trim()) missing.push("apellido");
    if (!form.rut.trim()) missing.push("rut");
    if (!form.telefono.trim()) missing.push("telefono");
    if (!form.email.trim()) missing.push("email");
    if (rolesSelected.length === 0) missing.push("roles");

    if (missing.length) {
      return `Faltan campos obligatorios: ${missing.join(", ")}`;
    }
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
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      rut: form.rut.trim(),
      direccion: form.direccion.trim() ? form.direccion.trim() : null,
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
      alert("No se pudo copiar automáticamente. Cópiala manualmente.");
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

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Nuevo personal</h1>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      {created ? (
        <div style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
          <h3>Personal creado</h3>
          <p>
            <strong>ID:</strong> {created.id_personal ?? "-"}
            <br />
            <strong>Email:</strong> {created.email}
            <br />
            <strong>Clave temporal:</strong>{" "}
            <code>{created.password_temporal ?? "(no recibida)"}</code>
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={copyTempPassword} disabled={!created.password_temporal}>
              Copiar clave temporal
            </button>
            <button type="button" onClick={() => navigate("/personal")}>
              Ir al listado
            </button>
            <button type="button" onClick={resetForm}>
              Crear otro personal
            </button>
          </div>

          <p style={{ marginTop: 10 }}>
            Importante: guarda esta clave; después el usuario deberá cambiarla al iniciar sesión.
          </p>
        </div>
      ) : null}

      <form onSubmit={onSubmit}>
        <fieldset disabled={!!created}>
          <legend>Datos</legend>

          <div>
            <label>
              Nombre
              <br />
              <input name="nombre" value={form.nombre} onChange={onChange} required />
            </label>
          </div>

          <div>
            <label>
              Apellido
              <br />
              <input name="apellido" value={form.apellido} onChange={onChange} required />
            </label>
          </div>

          <div>
            <label>
              RUT
              <br />
              <input name="rut" value={form.rut} onChange={onChange} required />
            </label>
          </div>

          <div>
            <label>
              Dirección
              <br />
              <input name="direccion" value={form.direccion} onChange={onChange} />
            </label>
          </div>

          <div>
            <label>
              Teléfono
              <br />
              <input name="telefono" value={form.telefono} onChange={onChange} required />
            </label>
          </div>

          <div>
            <label>
              Email
              <br />
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                type="email"
                required
              />
            </label>
          </div>
        </fieldset>

        <fieldset disabled={!!created}>
          <legend>Roles (puedes seleccionar más de uno)</legend>

          {roles.length === 0 ? (
            <p>No hay roles cargados.</p>
          ) : (
            roles.map((r) => {
              const id = Number(r.id_rol);
              const checked = rolesSelected.includes(id);

              return (
                <div key={id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(id)}
                    />{" "}
                    {rolesById.get(id)?.nombre ?? r.nombre} (id: {id})
                  </label>
                </div>
              );
            })
          )}
        </fieldset>

        <div style={{ marginTop: 10 }}>
          <button type="submit" disabled={!!created}>
            Registrar personal
          </button>{" "}
          <button type="button" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </form>
    </div>
  );
}
