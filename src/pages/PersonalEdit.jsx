import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";

function normalizeRolesFromApi(personalData) {
  // Soporta:
  // - personal.roles: [{id_rol, nombre}, ...]
  // - personal.roles: [1,2]
  // - personal.roles: ["administradora", ...] (no ideal)
  const roles = personalData?.roles;
  if (!roles) return [];

  if (Array.isArray(roles)) {
    if (roles.length === 0) return [];
    const first = roles[0];

    if (typeof first === "number") return roles.map(Number);
    if (typeof first === "string") return []; // sin catálogo no mapeamos

    if (typeof first === "object" && first !== null) {
      return roles
        .map((r) => r?.id_rol)
        .filter((x) => x !== undefined && x !== null)
        .map(Number);
    }
  }

  return [];
}

export default function PersonalEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [rolesCatalogo, setRolesCatalogo] = useState([]);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [rut, setRut] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // multi-rol (ids)
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);

  const rolesSeleccionadosSet = useMemo(
    () => new Set(rolesSeleccionados.map(Number)),
    [rolesSeleccionados]
  );

  function toggleRol(idRol) {
    const n = Number(idRol);
    setRolesSeleccionados((prev) => {
      const s = new Set(prev.map(Number));
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return Array.from(s);
    });
  }

  async function loadAll() {
    setLoading(true);
    setError("");
    setOkMsg("");

    try {
      const [resRoles, resPersonal] = await Promise.all([
        http.get("/roles"),
        http.get(`/personal/${id}`),
      ]);

      const rolesArr = Array.isArray(resRoles.data) ? resRoles.data : [];
      setRolesCatalogo(rolesArr);

      // backend puede devolver:
      // - objeto plano
      // - { personal: {...}, roles: [...] }
      const p = resPersonal.data?.personal ?? resPersonal.data;

      if (!p) {
        setError("No se encontró el personal.");
        setLoading(false);
        return;
      }

      setNombre(p.nombre ?? "");
      setApellido(p.apellido ?? "");
      setRut(p.rut ?? "");
      setDireccion(p.direccion ?? "");
      setTelefono(p.telefono ?? "");
      setEmail(p.email ?? "");

      let idsRoles = normalizeRolesFromApi(p);

      // si backend trae roles en raíz: { personal, roles }
      if ((!idsRoles || idsRoles.length === 0) && Array.isArray(resPersonal.data?.roles)) {
        idsRoles = resPersonal.data.roles
          .map((r) => r?.id_rol)
          .filter((x) => x !== undefined && x !== null)
          .map(Number);
      }

      // mapeo por nombre si viniera ["administradora"] y tenemos catálogo
      if (
        (!idsRoles || idsRoles.length === 0) &&
        Array.isArray(p.roles) &&
        p.roles.length > 0 &&
        typeof p.roles[0] === "string" &&
        rolesArr.length > 0
      ) {
        const mapByName = new Map(
          rolesArr.map((r) => [String(r.nombre).toLowerCase(), Number(r.id_rol)])
        );
        idsRoles = p.roles
          .map((name) => mapByName.get(String(name).toLowerCase()))
          .filter((x) => x !== undefined);
      }

      setRolesSeleccionados(idsRoles || []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Error cargando datos del personal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function validate() {
    const missing = [];
    if (!nombre.trim()) missing.push("nombre");
    if (!apellido.trim()) missing.push("apellido");
    if (!rut.trim()) missing.push("rut");
    if (!direccion.trim()) missing.push("direccion");
    if (!telefono.trim()) missing.push("telefono");
    if (!email.trim()) missing.push("email");

    if (missing.length) return `Faltan campos obligatorios: ${missing.join(", ")}`;
    if (!rolesSeleccionados.length) return "Debes asignar al menos 1 rol (roles)";
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

    // 1) datos generales (SIN roles)
    const payloadPersonal = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rut: rut.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
    };

    // 2) roles (en endpoint dedicado)
    const payloadRoles = {
      roles: rolesSeleccionados.map(Number), // backend espera { roles: [ids...] }
    };

    try {
      setSaving(true);

      // Paso 1: actualizar datos
      await http.put(`/personal/${id}`, payloadPersonal);

      // Paso 2: actualizar roles
      await http.put(`/personal/${id}/roles`, payloadRoles);

      setOkMsg("Personal actualizado");
      navigate(`/personal/${id}`);
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "No se pudo actualizar el personal.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Cargando...</div>;

  return (
    <div>
      <h1>Editar personal</h1>

      <div style={{ marginBottom: 10 }}>
        <Link to={`/personal/${id}`}>Volver al detalle</Link> |{" "}
        <button type="button" onClick={loadAll} disabled={saving}>
          Recargar
        </button>
      </div>

      {error ? <p style={{ color: "crimson" }}>{error}</p> : null}
      {okMsg ? <p style={{ color: "green" }}>{okMsg}</p> : null}

      <form onSubmit={onSubmit}>
        <fieldset disabled={saving}>
          <div>
            <label>Nombre</label>
            <br />
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div>
            <label>Apellido</label>
            <br />
            <input value={apellido} onChange={(e) => setApellido(e.target.value)} />
          </div>

          <div>
            <label>RUT</label>
            <br />
            <input value={rut} onChange={(e) => setRut(e.target.value)} />
          </div>

          <div>
            <label>Dirección</label>
            <br />
            <input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>

          <div>
            <label>Teléfono</label>
            <br />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>

          <div>
            <label>Email</label>
            <br />
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <hr />

          <div>
            <strong>Roles</strong>
            <div style={{ marginTop: 6 }}>
              {rolesCatalogo.map((r) => (
                <div key={r.id_rol}>
                  <label>
                    <input
                      type="checkbox"
                      checked={rolesSeleccionadosSet.has(Number(r.id_rol))}
                      onChange={() => toggleRol(r.id_rol)}
                    />{" "}
                    {r.nombre}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="submit">{saving ? "Guardando..." : "Guardar cambios"}</button>{" "}
            <button type="button" onClick={() => navigate(-1)} disabled={saving}>
              Cancelar
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
