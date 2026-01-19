import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

function rolesToText(p) {
  const r = p?.roles;

  if (Array.isArray(r)) {
    if (r.length === 0) return "-";
    if (typeof r[0] === "string") return r.join(", ");
    if (typeof r[0] === "object" && r[0] !== null) {
      return r.map((x) => x.nombre ?? x.role ?? x.name).filter(Boolean).join(", ") || "-";
    }
  }

  if (typeof p?.rol === "string") return p.rol;
  if (typeof p?.rol_nombre === "string") return p.rol_nombre;
  if (typeof p?.role_name === "string") return p.role_name;

  return "-";
}

export default function PersonalList() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [showInactivos, setShowInactivos] = useState(false);

  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/personal");
      const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el listado de personal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function toggleActivo(p) {
    const id = p.id_personal ?? p.id ?? p.idPersonal;
    if (!id) return;

    try {
      if (Number(p.activo) === 1) {
        await http.delete(`/personal/${id}`);
      } else {
        await http.put(`/personal/${id}/activar`);
      }

      await fetchAll();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar el estado del personal");
    }
  }

  const filteredSorted = useMemo(() => {
    const arr = Array.isArray(items) ? [...items] : [];

    const targetActivo = showInactivos ? 0 : 1;
    const filtered = arr.filter((p) => Number(p.activo) === targetActivo);

    filtered.sort((a, b) => {
      const aApe = (a.apellido ?? "").toString().toLowerCase();
      const bApe = (b.apellido ?? "").toString().toLowerCase();
      if (aApe !== bApe) return aApe.localeCompare(bApe);
      const aNom = (a.nombre ?? "").toString().toLowerCase();
      const bNom = (b.nombre ?? "").toString().toLowerCase();
      return aNom.localeCompare(bNom);
    });

    return filtered;
  }, [items, showInactivos]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;

  return (
    <div>
      <h1>Personal</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to="/dashboard">Volver al dashboard</Link>{" "}
        | <button type="button" onClick={fetchAll}>Recargar</button>{" "}
        | <Link to="/personal/nueva">Registrar nuevo personal</Link>
      </div>

      <label>
        <input
          type="checkbox"
          checked={showInactivos}
          onChange={(e) => setShowInactivos(e.target.checked)}
        />{" "}
        Mostrar personal inactivo
      </label>

      <hr />

      {filteredSorted.length === 0 ? (
        <p>
          {showInactivos ? "No hay personal inactivo." : "No hay personal activo."}
        </p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Activo</th>
              <th>Roles</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredSorted.map((p) => {
              const id = p.id_personal ?? p.id ?? p.idPersonal;
              const nombre = `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim() || "-";
              const activoTxt = Number(p.activo) === 1 ? "sí" : "no";

              return (
                <tr key={id ?? `${p.email}-${nombre}`}>
                  <td>{nombre}</td>
                  <td>{p.rut ?? "-"}</td>
                  <td>{p.email ?? "-"}</td>
                  <td>{p.telefono ?? "-"}</td>
                  <td>{activoTxt}</td>
                  <td>{rolesToText(p)}</td>
                  <td>
                    {id ? (
                      <>
                        <Link to={`/personal/${id}`}>Ver detalle</Link>
                        {" | "}
                        <Link to={`/personal/${id}/editar`}>Editar</Link>
                        {" | "}
                        <button type="button" onClick={() => toggleActivo(p)}>
                          {Number(p.activo) === 1 ? "Desactivar" : "Activar"}
                        </button>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
