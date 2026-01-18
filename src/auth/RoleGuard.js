// src/auth/RoleGuard.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RoleGuard({ allow = [], children }) {
  const { token, user } = useAuth();

  // Si no está logueado, fuera
  if (!token) return <Navigate to="/login" replace />;

  // Roles del usuario (según tu backend: en login devolviste user.roles)
  const roles = (user?.roles || []).map((r) =>
    typeof r === "string" ? r : r.nombre
  );

  // Admin pasa siempre si está incluido en allow o si allow está vacío
  const isAllowed =
    allow.length === 0 || roles.some((r) => allow.includes(r));

  if (!isAllowed) {
    return (
      <div>
        <h3>Acceso denegado</h3>
        <p>No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return children;
}
