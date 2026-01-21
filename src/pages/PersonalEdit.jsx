import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import http from "../api/http";
import "../App.css";

function normalizeRolesFromApi(personalData) {
  const roles = personalData?.roles;
  if (!roles) return [];

  if (Array.isArray(roles)) {
    if (roles.length === 0) return [];

    const first = roles[0];
    if (typeof first === "number") return roles.map(Number);
    if (typeof first === "string") return [];

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

  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);

  const rolesSeleccionadosSet = useMemo(
    () => new Set(rolesSeleccionados.map(Number)),
    [rolesSeleccionados]
  );

  function toggleRol(idRol) {
    const n = Number(idRol);
    setRolesSeleccionados((prev) => {
      const s = new Set(prev.map(Number));
      s.has(n) ? s.delete(n) : s.add(n);
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

      const p = resPersonal.data?.personal ?? resPersonal.data;
      if (!p) throw new Error("No se encontró el personal");

      setNombre(p.nombre ?? "");
      setApellido(p.apellido ?? "");
      setRut(p.rut ?? "");
      setDireccion(p.direccion ?? "");
      setTelefono(p.telefono ?? "");
      setEmail(p.email ?? "");

      let idsRoles = normalizeRolesFromApi(p);

      if (
        (!idsRoles || idsRoles.length === 0) &&
        Array.isArray(resPersonal.data?.roles)
      ) {
        idsRoles = resPersonal.data.roles
          .map((r) => r?.id_rol)
          .filter(Boolean)
          .map(Number);
      }

      if (
        (!idsRoles || idsRoles.length === 0) &&
        Array.isArray(p.roles) &&
        typeof p.roles[0] === "string"
      ) {
        const mapByName = new Map(
          rolesArr.map((r) => [r.nombre.toLowerCase(), Number(r.id_rol)])
        );

        idsRoles = p.roles
          .map((name) => mapByName.get(name.toLowerCase()))
          .filter(Boolean);
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
  }, [id]);

  function validate() {
    const missing = [];
    if (!nombre.trim()) missing.push("nombre");
    if (!apellido.trim()) missing.push("apellido");
    if (!rut.trim()) missing.push("rut");
    if (!direccion.trim()) missing.push("direccion");
    if (!telefono.trim()) missing.push("telefono");
    if (!email.trim()) missing.push("email");
    if (!rolesSeleccionados.length) missing.push("roles");

    return missing.length
      ? `Faltan campos obligatorios: ${missing.join(", ")}`
      : "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    const msg = validate();
    if (msg) return setError(msg);

    try {
      setSaving(true);

      await http.put(`/personal/${id}`, {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rut: rut.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
      });

      await http.put(`/personal/${id}/roles`, {
        roles: rolesSeleccionados.map(Number),
      });

      setOkMsg("Personal actualizado");
      navigate(`/personal/${id}`);
    } catch (e2) {
      setError(
        e2?.response?.data?.message ||
          "No se pudo actualizar el personal."
      );
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
        <h2 className="form-title">Editar personal</h2>

        <div className="form-actions" style={{ marginBottom: 18 }}>
          <Link to={`/personal/${id}`} className="btn">
            Volver al detalle
          </Link>

          <button
            type="button"
            className="btn"
            onClick={loadAll}
            disabled={saving}
          >
            Recargar
          </button>
        </div>

        {error && <p className="helper-error">{error}</p>}
        {okMsg && (
          <p style={{ textAlign: "center", color: "green", fontWeight: 600 }}>
            {okMsg}
          </p>
        )}

        <form onSubmit={onSubmit} className="form">
          <fieldset disabled={saving} style={{ border: "none", padding: 0 }}>
            <h3 style={{ textAlign: "center" }}>Datos personales</h3>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Nombre</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>

              <div className="form-field">
                <label>Apellido</label>
                <input
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>RUT</label>
              <input value={rut} onChange={(e) => setRut(e.target.value)} />
            </div>

            <div className="form-field">
              <label>Dirección</label>
              <input
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>

            <div className="form-row two-cols">
              <div className="form-field">
                <label>Teléfono</label>
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <h3 style={{ textAlign: "center", marginTop: 12 }}>
              Roles asignados
            </h3>

            <div className="roles-grid">
              {rolesCatalogo.map((r) => (
                <label key={r.id_rol} className="role-check">
                  <input
                    type="checkbox"
                    checked={rolesSeleccionadosSet.has(Number(r.id_rol))}
                    onChange={() => toggleRol(r.id_rol)}
                  />
                  {r.nombre}
                </label>
              ))}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary" disabled={saving}>
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
