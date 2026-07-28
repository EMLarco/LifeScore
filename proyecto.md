LifeScore – Progressive Web Application
🎯 Descripción General
LifeScore es una Progressive Web Application (PWA) fullstack diseñada para gamificar la formación de hábitos diarios. Los usuarios ganan puntos de experiencia (XP), suben de nivel, mantienen rachas (streaks) y desbloquean logros mientras registran sus actividades cotidianas. La aplicación integra autenticación segura, notificaciones push, modo offline, sistema de puntos canjeables por dinero real, tienda de skins, retos diarios/semanales/mensuales, un agente inteligente basado en IA, y un sistema de amigos con ranking competitivo.

🛠️ Tecnologías Utilizadas
Frontend	Backend	Base de Datos	Despliegue
React 19	Node.js + Express	PostgreSQL	Vercel (Frontend)
Mantine UI v7	JWT + 2FA	Neon / Supabase	Render (Backend)
Vite	Web-Push	-	GitHub Actions (CI/CD)
Workbox (PWA)	OpenRouter (IA)	-	-
📦 Funcionalidades Principales
Módulo	Características
Autenticación	Registro, Login con JWT, 2FA (TOTP), Google OAuth, cambio de contraseña, recuperación de cuenta.
Hábitos	CRUD completo, completado diario con cálculo de XP, niveles, rachas y desbloqueo de logros (365 anuales).
Retos	Diarios, semanales y mensuales con recompensas en puntos y XP.
Gamificación	Sistema de niveles, puntos, insignias, skins para avatar, cuerpo humano interactivo que cambia según nivel y género.
Tienda	Compra de puntos con PayPal (sandbox), canje de puntos por dinero real, compra de skins y banners.
Social	Amigos, ranking global y de amigos, desafíos competitivos entre pares.
Agente IA	Chat interactivo con IA (OpenRouter) que ofrece recomendaciones personalizadas de hábitos, ejercicio, lectura, alimentación y meditación (exclusivo premium).
Administración	Panel con estadísticas, gestión de usuarios, auditoría, exportación de informes PDF con diseño corporativo.
PWA	Funcionamiento offline, notificaciones push, instalación en dispositivo, splash screen personalizada.
🧠 Estructura del Proyecto (Resumen)
text
LifeScore/
├── frontend/               # React + Vite + Mantine UI
│   ├── public/             # Íconos, manifest.json, sw.js
│   ├── src/
│   │   ├── api/            # Axios + interceptores JWT
│   │   ├── components/     # Componentes reutilizables (habit, layout, friends, challenges)
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── hooks/          # useAuth, useLocalStorage, useOfflineSync
│   │   ├── pages/          # Dashboard, Habits, Challenges, Store, Ranking, etc.
│   │   ├── services/       # Llamadas a la API (auth, habits, payments, etc.)
│   │   ├── utils/          # Formatters, constants, validators
│   │   ├── db/             # IndexedDB para modo offline
│   │   └── App.jsx, main.jsx
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
├── backend/                # Node.js + Express
│   ├── src/
│   │   ├── config/         # Database pool, JWT, VAPID config
│   │   ├── models/         # User, Habit, HabitLog, Challenge, Payment, etc.
│   │   ├── controllers/    # Auth, Habits, Payments, Admin, Agent, etc.
│   │   ├── middlewares/    # Auth, Admin, Logger, ErrorHandler
│   │   ├── routes/         # Auth, Habits, Payments, Admin, etc.
│   │   ├── services/       # GamificationLogic, EmailService, AIService, PayPalService
│   │   ├── utils/          # JWT, Crypto helpers
│   │   └── app.js
│   ├── index.js
│   ├── .env.example
│   ├── package.json
│   └── database.sql
├── render.yaml             # Render blueprint para despliegue automático
├── vercel.json             # Configuración de Vercel para monorepo
├── .gitignore
└── README.md
📌 Demostración del Proyecto
🔐 Autenticación y Seguridad
Registro con validación de email y contraseña.

Inicio de sesión con JWT almacenado en localStorage.

Autenticación de dos factores (2FA) con códigos TOTP (Google Authenticator).

Inicio de sesión con Google OAuth.

📊 Dashboard Principal
Resumen de hábitos del día: completados vs totales.

Estadísticas de nivel, puntos, racha actual y máxima.

Cuerpo humano interactivo que cambia de color según nivel.

Horario del día actual (lectura desde base de datos).

Retos diarios disponibles con estado de progreso.

📋 Gestión de Hábitos
Crear, editar, eliminar y completar hábitos.

Cada completado suma XP y contribuye a la racha.

Visualización de hábitos activos con indicador de completado hoy.

Reordenamiento mediante drag & drop (con DndKit).

🏆 Gamificación y Logros
Sistema de logros anuales (365 días) con progreso visual.

Insignias especiales por hitos (racha de 7, 30, 60 días, niveles, etc.).

Retos diarios, semanales y mensuales con recompensas variables.

Puntos acumulados canjeables en la tienda.

🛒 Tienda y Monetización
Compra de paquetes de puntos con PayPal Sandbox.

Canje de puntos por dinero real (tasa de conversión 1000 pts = $1.50 USD).

Tienda de skins y banners para personalizar perfil.

Suscripción premium mensual/anual con acceso a funcionalidades exclusivas.

👥 Social y Ranking
Sistema de amigos con solicitudes y aceptación.

Ranking global y de amigos basado en puntos.

Desafíos entre amigos (retos competitivos con temporizador).

🤖 Agente Inteligente (IA)
Chat interactivo con IA (OpenRouter – GPT-4o-mini).

Recomendaciones personalizadas de ejercicio, lectura, alimentación y meditación.

Exclusivo para usuarios premium.

🛠️ Panel de Administración
Estadísticas de usuarios, hábitos, actividad y transacciones.

Gestión de usuarios (activar/desactivar premium, revocar 2FA, eliminar).

Gestión de hábitos y recompensas.

Auditoría del sistema con exportación a PDF personalizado.

📱 PWA y Modo Offline
Instalación en el dispositivo (splash screen, iconos, manifest).

Funcionamiento offline gracias a Service Worker e IndexedDB.

Sincronización automática al recuperar conexión.

🚀 Despliegue en Producción
Frontend: Vercel (con variables de entorno VITE_API_URL y VITE_VAPID_PUBLIC_KEY).

Backend: Render (usando render.yaml para crear automáticamente el servicio web y la base de datos PostgreSQL).

Base de Datos: Neon o Supabase (PostgreSQL serverless).

CI/CD: GitHub Actions para ejecutar pruebas automáticas antes del despliegue.

📈 Capturas de Pantalla (Referencia para Diapositivas)
Para la generación de diapositivas, se recomienda incluir capturas de las siguientes pantallas:

Página de Login

Dashboard

Mis Hábitos (lista y modal de creación)

Retos (diarios, semanales, mensuales)

Logros del Año (calendario)

Tienda de Puntos (paquetes de compra)

Tienda de Skins

Amigos (búsqueda y lista)

Ranking (global y amigos)

Agente IA (chat)

Panel de Administración (estadísticas y usuarios)

Factura PDF generada automáticamente

📋 Requisitos para la Demostración en Vivo
Usuario de prueba: admin@lifescore.com / admin123 (rol administrador).

Usuario premium de prueba: crear uno desde el panel admin o usar el flujo de compra con PayPal Sandbox.

Acceso a la aplicación: URL de Vercel (frontend) y URL de Render (backend).

Variables de entorno necesarias para el correcto funcionamiento de pagos y notificaciones push.

🧪 Tests y Calidad
Pruebas unitarias en backend y frontend con Vitest.

Cobertura de código >80%.

Linting y formateo con ESLint y Prettier.

Auditoría de Lighthouse para PWA (Performance >90, Accesibilidad >95, PWA 100%).

LifeScore representa una solución completa y profesional para el seguimiento gamificado de hábitos, integrando tecnologías modernas, un diseño atractivo y funcionalidades avanzadas que cubren desde la experiencia de usuario hasta la monetización y la administración del sistema.