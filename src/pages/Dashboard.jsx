import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const roles = user?.roles || [];
  const hasRole = (role) => roles.includes(role);

  const canVentas = hasRole("vendedora") || hasRole("administradora");
  const canAtenciones = hasRole("masoterapeuta") || hasRole("administradora");

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Köra Skin</h1>
          <p>
            Sesión iniciada como <strong>{user?.nombre} {user?.apellido}</strong>{" "}
            ({user?.email})
          </p>
          {roles.length > 0 && (
            <p>
              Roles: <strong>{roles.join(", ")}</strong>
            </p>
          )}
        </div>
      </header>

      <hr />

      <section>
        <h2>Acciones rápidas</h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {canVentas && (
            <Link to="/ventas/nueva">
              <button type="button">Registrar venta</button>
            </Link>
          )}

          {canAtenciones && (
            <Link to="/atenciones/nueva">
              <button type="button">Registrar atención</button>
            </Link>
          )}
        </div>

        {!canVentas && !canAtenciones && (
          <p>No tienes permisos para registrar ventas o atenciones.</p>
        )}
      </section>

      <hr />


      <section>
        <h2>Módulos</h2>

        <ul>
          <li>
            <Link to="/clientas">Clientas</Link>
          </li>

          {(hasRole("vendedora") || hasRole("administradora")) && (
            <>
              <li>
                <Link to="/productos">Productos</Link>
              </li>
              <li>
                <Link to="/ventas">Ventas</Link>
              </li>
            </>
          )}

          {(hasRole("masoterapeuta") || hasRole("administradora")) && (
            <>
              <li>
                <Link to="/servicios">Servicios</Link>
              </li>
              <li>
                <Link to="/atenciones">Atenciones</Link>
              </li>
            </>
          )}

          {hasRole("administradora") && (
            <>
              <li>
                <Link to="/personal">Personal</Link>
              </li>
              <li>
                <Link to="/roles">Roles</Link>
              </li>
            </>
          )}
        </ul>
      </section>
    </div>
  );
}
