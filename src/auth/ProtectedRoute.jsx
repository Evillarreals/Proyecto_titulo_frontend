import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Forzar cambio de clave: si debe cambiarla, no lo dejes entrar a nada excepto /cambiar-clave
  if (mustChangePassword && location.pathname !== "/cambiar-clave") {
    return <Navigate to="/cambiar-clave" replace />;
  }

  return children;
}
