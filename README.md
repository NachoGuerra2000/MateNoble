# Mates Artesanales — E-commerce

E-commerce completo para venta de mates artesanales con panel de administración.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + Tailwind CSS |
| Backend | Node.js + Express |
| Base de datos | MongoDB |
| Auth | JWT |

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MongoDB](https://www.mongodb.com/try/download/community) corriendo localmente en el puerto 27017
  - O una cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (gratis)

---

## Instalación paso a paso

### 1. Configurar el Backend

```bash
cd backend
npm install
```

Copiar el archivo de entorno:
```bash
cp .env.example .env
```

Editar `backend/.env` con tus valores (mínimo cambiar `JWT_SECRET`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mate-ecommerce
JWT_SECRET=pon_aqui_un_secreto_largo_y_aleatorio
FRONTEND_URL=http://localhost:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Crear el usuario administrador:
```bash
npm run create-admin
```

(Opcional) Cargar productos de ejemplo:
```bash
npm run seed
```

Iniciar el servidor:
```bash
npm run dev
```

El backend queda corriendo en **http://localhost:5000**

---

### 2. Configurar el Frontend

```bash
cd frontend
npm install
```

Copiar el archivo de entorno:
```bash
cp .env.local.example .env.local
```

El contenido por defecto apunta al backend local:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Iniciar el servidor de desarrollo:
```bash
npm run dev
```

El frontend queda en **http://localhost:3000**

---

## Uso

### Tienda (público)

| URL | Descripción |
|-----|-------------|
| `/` | Página principal con banner, productos destacados y categorías |
| `/productos` | Catálogo completo con filtro por categoría |
| Carrito | Ícono en la barra de navegación, slide-over lateral |

### Panel de administración

| URL | Descripción |
|-----|-------------|
| `/admin/login` | Login del administrador |
| `/admin/dashboard` | Panel CRUD de productos |

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

> Cambiá la contraseña en `backend/.env` antes de subir a producción y volvé a correr `npm run create-admin`.

---

## Funcionalidades

### Tienda
- Catálogo responsive con filtro de categorías
- Carrito persistente (localStorage) con control de cantidad
- Stock en tiempo real (sin stock = botón deshabilitado)
- Toggle para mostrar/ocultar productos sin stock

### Admin
- Login con JWT (token válido 7 días)
- Crear, editar y eliminar productos
- Control de stock, estado activo/inactivo y destacado
- Tabla con estadísticas de stock

### Backend API

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/products` | Público | Listar productos activos |
| GET | `/api/products/:id` | Público | Obtener producto por ID |
| GET | `/api/products/admin/all` | Admin | Todos los productos |
| POST | `/api/products` | Admin | Crear producto |
| PUT | `/api/products/:id` | Admin | Actualizar producto |
| DELETE | `/api/products/:id` | Admin | Eliminar producto |
| POST | `/api/auth/login` | Público | Login admin |
| GET | `/api/auth/verify` | Admin | Verificar token |

---

## Estructura del proyecto

```
Pagina web/
├── backend/
│   ├── config/db.js
│   ├── middleware/authMiddleware.js
│   ├── models/
│   │   ├── Product.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── products.js
│   ├── scripts/
│   │   ├── createAdmin.js
│   │   └── seedProducts.js
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.js              ← Home
    │   ├── productos/page.js    ← Catálogo
    │   └── admin/
    │       ├── login/page.js
    │       └── dashboard/page.js
    ├── components/
    │   ├── Banner.js
    │   ├── CartSidebar.js
    │   ├── Footer.js
    │   ├── Navbar.js
    │   ├── ProductCard.js
    │   └── Providers.js
    ├── context/
    │   ├── AuthContext.js
    │   └── CartContext.js
    └── lib/api.js
```

---

## Agregar nuevas categorías

1. En `backend/models/Product.js`, agregar el nuevo valor al array `enum` del campo `category`.
2. En `frontend/tailwind.config.js` o `frontend/app/productos/page.js`, agregar la etiqueta en el array `CATEGORIES`.
3. En `frontend/app/page.js`, agregar la tarjeta en el array `CATEGORIES` de la sección de categorías.

---

## Producción

Para hacer el build de producción del frontend:
```bash
cd frontend
npm run build
npm start
```

Para el backend en producción se recomienda usar [PM2](https://pm2.keymetrics.io/):
```bash
npm install -g pm2
cd backend
pm2 start server.js --name mate-backend
```
