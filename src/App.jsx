import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import { useAuth } from './auth/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import ClientasList from './pages/ClientasList';
import ClientaForm from './pages/ClientaForm';
import ClientaDetail from './pages/ClientaDetail';
import ClientaEdit from './pages/ClientaEdit';

import ProductosList from './pages/ProductosList';
import ProductoForm from './pages/ProductoForm';
import ProductoDetail from './pages/ProductoDetail';
import ProductoEdit from './pages/ProductoEdit';

import ServiciosList from './pages/ServiciosList';
import ServicioForm from './pages/ServicioForm';
import ServicioDetail from './pages/ServicioDetail';
import ServicioEdit from './pages/ServiciosEdit';

import VentasList from './pages/VentasList';
import VentaForm from './pages/VentaForm';
import VentaDetail from './pages/VentaDetail';
import VentaEdit from './pages/VentaEdit';

import AtencionesList from './pages/AtencionesList';
import AtencionForm from './pages/AtencionForm';
import AtencionDetail from './pages/AtencionDetail';
import AtencionEdit from './pages/AtencionesEdit';

import PagosVentaForm from "./pages/PagosVentaForm";
import PagosAtencionForm from "./pages/PagosAtencionForm";

import PersonalList from './pages/PersonalList';
import PersonalForm from './pages/PersonalForm';
import PersonalDetail from './pages/PersonalDetail';
import PersonalEdit from './pages/PersonalEdit';

import ChangePassword from './pages/ChangePassword';

export default function App() {
  const { token, logout, user } = useAuth();

  return (
    <div>
      <header>
        <h2>Köra Skin</h2>

        {token && (
          <div>
            <span>{user?.email}</span>{' '}
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        )}

        {token && (
          <nav>
            <Link to="/">Dashboard</Link> |{' '}
            <Link to="/clientas">Clientas</Link> |{' '}
            <Link to="/productos">Productos</Link> |{' '}
            <Link to="/servicios">Servicios</Link> |{' '}
            <Link to="/ventas">Ventas</Link> |{' '}
            <Link to="/atenciones">Atenciones</Link> |{' '}
            <Link to="/personal">Personal</Link>
          </nav>
        )}
        <hr />
      </header>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>

        {/* Clientas */}
        <Route path="/clientas" element={<ProtectedRoute><ClientasList /></ProtectedRoute>} />
        <Route path="/clientas/nueva" element={<ProtectedRoute><ClientaForm /></ProtectedRoute>} />
        <Route path="/clientas/:id" element={<ProtectedRoute><ClientaDetail /></ProtectedRoute>} />
        <Route path="/clientas/:id/editar" element={<ProtectedRoute><ClientaEdit /></ProtectedRoute>} />

        {/* Productos */}
        <Route path="/productos" element={<ProtectedRoute><ProductosList /></ProtectedRoute>} />
        <Route path="/productos/nuevo" element={<ProtectedRoute><ProductoForm /></ProtectedRoute>} />
        <Route path="/productos/:id" element={<ProtectedRoute><ProductoDetail /></ProtectedRoute>} />
        <Route path="/productos/:id/editar" element={<ProtectedRoute><ProductoEdit /></ProtectedRoute>} />

        {/* Servicios */}
        <Route path="/servicios" element={<ProtectedRoute><ServiciosList /></ProtectedRoute>} />
        <Route path="/servicios/nuevo" element={<ProtectedRoute><ServicioForm /></ProtectedRoute>} />
        <Route path="/servicios/:id" element={<ProtectedRoute><ServicioDetail /></ProtectedRoute>} />
        <Route path="/servicios/:id/editar" element={<ProtectedRoute><ServicioEdit /></ProtectedRoute>} />

        {/* Ventas */}
        <Route path="/ventas" element={<ProtectedRoute><VentasList /></ProtectedRoute>} />
        <Route path="/ventas/nueva" element={<ProtectedRoute><VentaForm /></ProtectedRoute>} />
        <Route path="/ventas/:id" element={<ProtectedRoute><VentaDetail /></ProtectedRoute>} />
        <Route path="/ventas/:id/editar" element={<ProtectedRoute><VentaEdit /></ProtectedRoute>} />

        {/* Atenciones */}
        <Route path="/atenciones" element={<ProtectedRoute><AtencionesList /></ProtectedRoute>} />
        <Route path="/atenciones/nueva" element={<ProtectedRoute><AtencionForm /></ProtectedRoute>} />
        <Route path="/atenciones/:id" element={<ProtectedRoute><AtencionDetail /></ProtectedRoute>} />
        <Route path="/atenciones/:id/editar" element={<ProtectedRoute><AtencionEdit /></ProtectedRoute>} />

        {/* Personal */}
        <Route path="/personal" element={<ProtectedRoute><PersonalList /></ProtectedRoute>} />
        <Route path="/personal/nueva" element={<ProtectedRoute><PersonalForm /></ProtectedRoute>} />
        <Route path="/personal/:id" element={<ProtectedRoute><PersonalDetail /></ProtectedRoute>} />
        <Route path='/personal/:id/editar' element={<ProtectedRoute><PersonalEdit /></ProtectedRoute>} />

        {/* Pagos */}
        <Route path="/ventas/:id/pagos/nuevo" element={<ProtectedRoute><PagosVentaForm /></ProtectedRoute>}/>
        <Route path="/atenciones/:id/pagos/nuevo" element={<ProtectedRoute><PagosAtencionForm /></ProtectedRoute>}/>

        {/* Cambio de clave */ }
        <Route path="/cambiar-clave" element={ <ProtectedRoute><ChangePassword /></ProtectedRoute>} />

      </Routes>
    </div>
  );
}
