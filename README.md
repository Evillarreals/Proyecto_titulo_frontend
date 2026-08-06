# Köra Skin — Frontend

Interfaz web construida con **React** y **Vite** para el sistema de gestión de un centro de estética/masoterapia: agenda de atenciones, ventas de productos, clientas, personal y control de stock.

Proyecto de título — Técnico en Analista Programador, IPLACEX. Consume la API de [`proyecto_titulo_backend`](https://github.com/evillarreals/proyecto_titulo_backend).

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?logo=axios&logoColor=white)

## Tabla de contenidos

- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Ejecución](#ejecución)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Rutas de la aplicación](#rutas-de-la-aplicación)

## Funcionalidades

- Login con JWT, con flujo de **cambio de contraseña obligatorio** para personal recién creado.
- Rutas protegidas por autenticación y por rol (`administradora`, `vendedora`, `masoterapeuta`) mediante `ProtectedRoute` y `RoleGuard`.
- CRUD completo para **clientas**, **productos**, **servicios** y **personal**.
- Registro de **ventas** (con control de stock) y **atenciones** (agenda, con detección de conflictos de horario en el backend).
- Registro de **pagos** (parciales o totales) sobre ventas y atenciones, con cálculo de saldo.

## Tecnologías

- [React 19](https://react.dev/)
- [Vite 7](https://vitejs.dev/)
- [React Router 7](https://reactrouter.com/)
- [Axios](https://axios-http.com/) (cliente HTTP con interceptor de token JWT)

## Requisitos previos

- Node.js 18 o superior
- El [backend](https://github.com/evillarreals/proyecto_titulo_backend) corriendo (local o remoto) con la base de datos ya creada

## Instalación

```bash
git clone https://github.com/Evillarreals/Proyecto_titulo_frontend.git
cd Proyecto_titulo_frontend
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3000
```

| Variable        | Descripción                                  |
| ---------------- | ----------------------------------------------- |
| `VITE_API_URL`   | URL base del backend. Si no se define, usa `http://localhost:3000` por defecto. |

## Ejecución

```bash
npm run dev
```

La app queda disponible en `http://localhost:5173`. Inicia sesión con un usuario creado en la base de datos del backend (ver el README del backend para crear un usuario administrador de prueba).

### Build de producción

```bash
npm run build
npm run preview
```

## Estructura del proyecto

```
frontend/
├── src/
│   ├── api/
│   │   └── http.js               # Cliente Axios (baseURL + interceptor de Authorization)
│   ├── auth/
│   │   ├── AuthContext.jsx        # Estado de sesión (token, usuario) en localStorage
│   │   ├── ProtectedRoute.jsx     # Redirige a /login si no hay sesión
│   │   └── RoleGuard.js           # Restringe una vista a ciertos roles
│   ├── pages/                     # Una página por recurso: List / Form / Detail / Edit
│   └── App.jsx                    # Layout, navegación y definición de rutas
└── vite.config.js
```

## Rutas de la aplicación

| Ruta                          | Descripción                     |
| ------------------------------ | ---------------------------------- |
| `/login`                        | Inicio de sesión                    |
| `/dashboard`                     | Panel principal                     |
| `/clientas`, `/clientas/nueva`, `/clientas/:id`, `/clientas/:id/editar`     | CRUD de clientas   |
| `/productos`, `/productos/nuevo`, `/productos/:id`, `/productos/:id/editar` | CRUD de productos  |
| `/servicios`, `/servicios/nuevo`, `/servicios/:id`, `/servicios/:id/editar` | CRUD de servicios  |
| `/ventas`, `/ventas/nueva`, `/ventas/:id`, `/ventas/:id/editar`             | CRUD de ventas     |
| `/atenciones`, `/atenciones/nueva`, `/atenciones/:id`, `/atenciones/:id/editar` | CRUD de atenciones (agenda) |
| `/personal`, `/personal/nueva`, `/personal/:id`, `/personal/:id/editar`     | CRUD de personal   |
| `/ventas/:id/pagos/nuevo`, `/atenciones/:id/pagos/nuevo`                    | Registro de pagos  |
| `/cambiar-clave`                 | Cambio de contraseña obligatorio/voluntario |

---

Desarrollado por **Esteban Villarreal** como Proyecto de Título — IPLACEX.
