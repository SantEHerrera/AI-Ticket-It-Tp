# AI Ticket It — Plataforma de Eventos y Venta de Entradas

Trabajo Práctico para la materia **Desarrollo de Software (DDS)** de la carrera **Ingeniería en Sistemas de Información** de la **UTN FRBA**.

El proyecto es un **monorepo** gestionado con `npm workspaces` que integra:
- **Backend:** Servidor Node.js + Express con diseño de dominio (DDD) y repositorios en memoria.
- **Frontend:** Aplicación móvil multiplataforma desarrollada en **React Native** con **Expo** (JavaScript y JSX).

---

## 📦 Estructura del Proyecto

```
.
├── packages/
│   ├── backend/        # Servidor Express.js (Puerto 8000)
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── dominio/
│   │   │   ├── repositorios/
│   │   │   ├── rutas/
│   │   │   └── servicios/
│   │   └── .env
│   └── frontend/       # Aplicación Móvil React Native (Expo SDK 58)
│       ├── src/
│       │   ├── components/       # Tarjetas de eventos, badges de estado, header y selector
│       │   ├── context/          # AuthContext (conmutador entre Comprador y Organizador)
│       │   ├── features/
│       │   │   ├── comprador/    # Catálogo, Detalle/Compra, Favoritos, Mis Compras, Chat, Reseña
│       │   │   └── organizador/  # Mis Eventos, Publicar Evento, Ventas y Check-in
│       │   ├── service/          # Clientes API (Axios con inyección de x-user-id)
│       │   └── theme/            # Paleta de colores e identidad visual
│       ├── app.json
│       ├── metro.config.js
│       └── .env
├── package.json        # Configuración del monorepo (root)
└── README.md
```

---

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias
Desde la raíz del repositorio:
```bash
npm install
```

### 2. Ejecutar la Aplicación

Podés iniciar ambos proyectos en simultáneo o cada uno por separado:

#### Opción A: Iniciar Ambos (Recomendado)
```bash
npm run start:dev
```

#### Opción B: Iniciar por separado
- **Backend:**
  ```bash
  npm run dev:backend
  ```
  *(El backend se levantará en `http://localhost:8000` con recarga automática)*

- **Frontend (React Native / Expo):**
  ```bash
  npm run start:frontend
  ```
  Al iniciar Expo, podés elegir cómo visualizar la app:
  - Presionar **`w`** en la terminal para abrirlo en el **navegador web** (`http://localhost:8081`).
  - Presionar **`a`** para abrir en un emulador de **Android**.
  - Escanear el **código QR** desde tu celular usando la app **Expo Go** (Android o iOS).

---

## 📱 Funcionalidades Implementadas en la App Móvil

### 👤 Selector de Usuario en Vivo (Barra Superior)
En la parte superior de la aplicación tenés un botón con el usuario activo. Al tocarlo podés alternar en tiempo real entre:
- **Sofía Ruiz** (*Comprador*)
- **Diego Alonso** (*Comprador*)
- **Lucía Gómez** (*Organizador*)
- **Martín Pérez** (*Organizador*)

La interfaz y la barra de navegación inferior se adaptan automáticamente según el rol del usuario seleccionado.

### 🎟️ Flujo del Comprador
1. **Explorar y Descubrir Eventos:**
   - Barra de búsqueda por texto.
   - Filtros dinámicos por categorías (Música, Teatro, Deportes, Gastronomía).
   - Ordenamiento por fecha, menor precio o mejor reputación del organizador.
   - Tarjetas de eventos con fotos, badges de días restantes y precios desde.
2. **Detalle del Evento y Compra:**
   - Galería de imágenes, descripción completa, cuenta regresiva.
   - Datos del productor y reputación con opiniones reales de otros compradores.
   - Selección de sector/tipo de entrada (General, VIP, Platea) con cupo disponible en tiempo real.
   - Selector de cantidad y cálculo de total.
   - Botón de compra: genera la reserva en estado `PENDIENTE`.
3. **Favoritos:**
   - Guardar y remover eventos favoritos con un toque en el icono de corazón.
4. **Mis Compras y Seguimiento de Tickets:**
   - Tarjeta interactiva tipo ticket con corte estético y código.
   - Estado del ticket en tiempo real: `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`.
   - Botón para **Pagar** la entrada pendiente o **Cancelar** la reserva.
   - Días restantes para el evento.
   - Historial de transiciones de estado con fecha y responsable.
5. **Canal de Comunicación (Chat):**
   - Hilo de mensajes bidireccional entre el comprador y el organizador por cada compra.
   - Envío de consultas sobre acceso, ubicación o cambios de fecha.
6. **Reseñas Post-Evento:**
   - Al marcarse la entrada como `UTILIZADA`, se habilita la opción de calificar el espectáculo con 1 a 5 estrellas y dejar un comentario.

### 🎪 Flujo del Organizador
1. **Panel Mis Eventos:**
   - Listado de los eventos publicados por el productor.
   - Tarjeta con la reputación promedio del organizador.
2. **Publicación de Eventos:**
   - Formulario para crear un nuevo evento con título, descripción, categoría, fecha y foto.
   - Creación dinámica de tipos de entrada (sectores, precios y cupos disponibles).
3. **Gestión de Ventas y Check-in en Puerta:**
   - Pantalla de control de acceso para cada evento.
   - Muestra métricas de recaudación total y entradas vendidas.
   - Desglose de disponibilidad por sector.
   - Listado de asistentes con botón para **Marcar Utilizada (Check-in)** al ingresar.
   - Acceso al chat para responder mensajes a cada comprador.
