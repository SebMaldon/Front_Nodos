# Sistema de Gestión de Nodos (IMSS)

Este proyecto es una aplicación web frontend desarrollada con **React** y **Vite** para la gestión, registro y visualización de nodos de la red del IMSS (Instituto Mexicano del Seguro Social).

## 🚀 Características Principales

La aplicación cuenta con un sistema de navegación que incluye:

- **🏠 Inicio**: Pantalla de bienvenida y métricas generales.
- **📋 Catálogo de Nodos**: Visualización tabular completa de los registros de nodos (`TablaRegistros`).
- **⚙️ Gestión**: Módulo para agregar y editar información de nodos (`NodeForm` y `NodeTable`).
- **⚠️ Prioritarios**: Sección dedicada a nodos candidatos a sustitución o con prioridad alta (`NodosSustitucion`).

## 🛠️ Stack Tecnológico

- **Core**: React 19, Vite.
- **Estilos**: CSS Modules, Material UI (@mui/material), FontAwesome.
- **HTTP Client**: Axios.
- **Routing**: React Router DOM v7.
- **Manejo de Datos**: ExcelJS, XLSX (para exportación/importación de reportes).

## 🔧 Requisitos Previos

- Node.js (v18 o superior recomendado)
- NPM o Yarn
- Backend API corriendo en `http://localhost:5000`

## 📦 Instalación y Ejecución

1. **Clonar el repositorio** y entrar a la carpeta del proyecto.
2. **Instalar dependencias**:
   ```bash
   npm install
   ```
3. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:20172` (o el puerto que indique la consola).

## 📂 Estructura del Proyecto

```text
src/
├── assets/         # Imágenes y recursos estáticos
├── components/     # Componentes reutilizables (Formularios, Tablas)
├── pages/          # Vistas principales (Inicio, Catálogo, Gestión)
├── App.jsx         # Configuración de Rutas y Layout principal
└── main.jsx        # Punto de entrada
```

## 📝 Notas de Desarrollo

- El proyecto utiliza variables de entorno para configuración (asegúrate de configurar `.env` si es necesario).
- Asegúrate de que el backend esté ejecutándose para que las peticiones a `/api/nodos` funcionen correctamente.
