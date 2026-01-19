import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";

function rolesToList(personal) {
  const r = personal?.roles;

  if (Array.isArray(r)) {
    if (r.length === 0) return [];
    if (typeof r[0] === "string") return r.filter(Boolean);
    if (typeof r[0] === "object" && r[0] !== null) {
      return r
        .map((x) => x.nombre ?? x.role ?? x.name)
        .filter(Boolean);
    }
  }

  const single =
    (typeof personal?.rol === "string" && personal.rol) ||
    (typeof personal?.rol_nombre === "string" && personal.rol_nombre) ||
    (typeof personal?.role_name === "string" && personal.role_name);

  return single ? [single] : [];
}

export default function PersonalDetail() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  async function fetchOne() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get(`/personal/${id}`);
      const payload =
        (res.data?.personal ?? res.data?.data ?? res.data) || null;
      setData(payload);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el detalle del personal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOne();
  }, [id]);

  const roles = useMemo(() => rolesToList(data), [data]);

  if (loading) return <div>Cargando...</div>;
  if (err) return <div style={{ color: "crimson" }}>{err}</div>;
  if (!data) return <div>No existe el registro.</div>;

  const nombre = `${data.nombre ?? ""} ${data.apellido ?? ""}`.trim() || "-";
  const activoTxt =
    "activo" in data ? (Number(data.activo) === 1 ? "sí" : "no") : "-";

  return (
    <div>
      <h1>Detalle personal</h1>

      <div style={{ marginBottom: 12 }}>
        <Link to="/personal">Volver</Link>{" "}
        | <Link to={`/personal/${id}/editar`}>Editar</Link>{" "}
        | <button type="button" onClick={fetchOne}>Recargar</button>
      </div>

      <hr />

      <h2>Información general</h2>

      <p>
        <strong>Nombre:</strong> {nombre}
      </p>
      <p>
        <strong>RUT:</strong> {data.rut ?? "-"}
      </p>
      <p>
        <strong>Email:</strong> {data.email ?? "-"}
      </p>
      <p>
        <strong>Teléfono:</strong> {data.telefono ?? "-"}
      </p>
      <p>
        <strong>Dirección:</strong> {data.direccion ?? "-"}
      </p>
      <p>
        <strong>Activo:</strong> {activoTxt}
      </p>

      <hr />

      <h2>Roles</h2>
      {roles.length === 0 ? (
        <p>-</p>
      ) : (
        <ul>
          {roles.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
