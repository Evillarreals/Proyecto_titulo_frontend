import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "../App.css"; 

export default function Dashboard() {
  const { user, logout } = useAuth();

  const roles = user?.roles || [];
  const hasRole = (role) => roles.includes(role);

  const canVentas = hasRole("vendedora") || hasRole("administradora");
  const canAtenciones = hasRole("masoterapeuta") || hasRole("administradora");

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      </header>
      <section>
        <h2>Acciones rápidas</h2>

        <div className="quick-actions">
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

        <div className="modules-grid">
            <Link to="/clientas" className="module-btn">Clientas</Link>
          {(hasRole("vendedora") || hasRole("administradora")) && (
            <>
                <Link to="/productos" className="module-btn">Productos</Link>
                <Link to="/ventas" className="module-btn">Ventas</Link>
            </>
          )}

          {(hasRole("masoterapeuta") || hasRole("administradora")) && (
            <>
                <Link to="/servicios" className="module-btn">Servicios</Link>
                <Link to="/atenciones" className="module-btn">Atenciones</Link>
            </>
          )}
          {hasRole("administradora") && (
            <>
                <Link to="/personal" className="module-btn">Personal</Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
