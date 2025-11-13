# Visualizador SSC / Guía

Aplicación Next.js para visualizar documentos SSC y guías de despacho.

## 🚀 Despliegue

### Opción 1: Nixpacks (Railway, Render)

El proyecto está configurado con `nixpacks.toml` que especifica Node.js 20.x. Solo necesitas:

1. Conectar tu repositorio
2. El despliegue se hará automáticamente

### Opción 2: Docker

Construir y ejecutar con Docker:

```bash
# Construir la imagen
docker build -t visualizador-ssc .

# Ejecutar el contenedor
docker run -p 3000:3000 visualizador-ssc
```

### Opción 3: Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Ejecutar en modo desarrollo
pnpm dev

# Compilar para producción
pnpm build

# Ejecutar en producción
pnpm start
```

## 📋 Requisitos

- **Node.js**: >= 20.9.0
- **pnpm**: >= 9.0.0

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crea un archivo `.env.local` si necesitas configuraciones adicionales:

```env
# Next.js
NEXT_TELEMETRY_DISABLED=1
```

## 🏗️ Tecnologías

- **Next.js 16**: Framework React
- **React 19**: Biblioteca UI
- **Tailwind CSS 4**: Estilos
- **TypeScript**: Tipado estático
- **Radix UI**: Componentes accesibles
- **Lucide Icons**: Iconografía

## 📝 Características

- ✅ Búsqueda de documentos SSC y guías
- ✅ Visualización de PDFs externos
- ✅ Carga de imágenes con múltiples formatos
- ✅ Interfaz responsiva y moderna
- ✅ Modo oscuro (soporte futuro)

## 🐛 Solución de Problemas

### Error: "Node.js version >=20.9.0 is required"

Asegúrate de usar Node.js 20 o superior:

```bash
node --version  # Debe ser >= 20.9.0
```

### Puerto en uso

Si el puerto 3000 está ocupado, el servidor usará el siguiente disponible (3001, 3002, etc.)

## 📦 Estructura del Proyecto

```
.
├── app/              # Páginas y layouts de Next.js
├── components/       # Componentes reutilizables
│   └── ui/          # Componentes de UI (shadcn/ui)
├── lib/             # Utilidades y helpers
├── public/          # Archivos estáticos
└── styles/          # Estilos globales
```

## 🚢 Despliegue en Producción

### Railway / Render

1. Conecta tu repositorio Git
2. El archivo `nixpacks.toml` configurará automáticamente Node.js 20
3. El despliegue se completará automáticamente

### Vercel

```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Desplegar
vercel
```

### Docker en servidor VPS

```bash
# Construir
docker build -t visualizador-ssc .

# Ejecutar en background
docker run -d -p 80:3000 --name visualizador visualizador-ssc

# Ver logs
docker logs visualizador
```

## 📄 Licencia

Privado
