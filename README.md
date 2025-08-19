# 🧠 BESS Permitting Multi-Agent System

Sistema multi-agente para la generación automatizada de documentos de permisos para proyectos BESS (Battery Energy Storage Systems) en Chile.

## 🏗️ Arquitectura

Este sistema utiliza una arquitectura **agent-first** con:

- **Backend Python** con FastAPI para la orquestación de agentes
- **Frontend Next.js** con TypeScript para la interfaz de usuario
- **OpenRouter** para el enrutamiento dinámico de modelos LLM
- **SQLite** para persistencia local (MVP)
- **Agentes especializados** para cada etapa del proceso

## 🤖 Agentes Implementados

### Agente Orquestador
- Coordina la ejecución entre agentes
- Mantiene el estado global del proyecto
- Gestiona dependencias entre tareas

### Agente de Ingesta
- Procesa documentos PDF, DOC, DOCX, TXT, EML
- Extrae datos estructurados usando LLMs
- Mapea fuentes para trazabilidad

### Agente de Redacción
- Genera documentos específicos para Chile:
  - Estudio de Impacto Ambiental
  - Solicitud de Interconexión
  - Permiso de Uso de Suelo
  - Permiso de Construcción
  - Certificación de Seguridad Eléctrica
  - Estudio de Conexión a Subestación

### Agente Revisor de Calidad
- Evalúa documentos con puntajes 0-100
- Identifica elementos faltantes
- Proporciona recomendaciones específicas

### Agente de Integración de Feedback
- Incorpora feedback humano y de agentes
- Mejora iterativa de documentos
- Gestión de versiones

### Agente de Seguimiento de Progreso
- Calcula KPIs del proyecto y sistema
- Genera reportes de progreso
- Métricas de rendimiento de agentes

## 🚀 Instalación y Configuración

### Prerrequisitos

- Python 3.11+
- Node.js 18+
- OpenRouter API key

### Backend (Python)

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp ../.env.example .env
# Editar .env con tu clave de OpenRouter

# Ejecutar servidor
python main.py
```

### Frontend (Next.js)

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev
```

## 🔧 Configuración

### Variables de Entorno

Copie `.env.example` a `.env` y configure:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
DATABASE_URL=sqlite:///./bess_permitting.db
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Obtener Clave de OpenRouter

1. Regístrese en [OpenRouter](https://openrouter.ai/)
2. Obtenga su API key
3. Agregue crédito a su cuenta para usar los modelos

## 📊 Uso del Sistema

### 1. Crear Proyecto

1. Acceda a `http://localhost:3000`
2. Haga clic en "Nuevo Proyecto"
3. Complete la información básica del proyecto BESS

### 2. Subir Documentos

1. En la página del proyecto, use el área de carga de archivos
2. Suba documentos técnicos, ambientales, o regulatorios
3. El sistema procesará automáticamente los archivos

### 3. Revisión y Aprobación

1. Los agentes generarán borradores automáticamente
2. Revise los documentos generados
3. Proporcione feedback para mejoras iterativas
4. Apruebe o rechace documentos

### 4. Dashboard Ejecutivo

- Acceda a `/dashboard` para métricas globales
- Vea KPIs de rendimiento del sistema
- Monitoree progreso de todos los proyectos

### 5. Trazabilidad de Agentes

- Cada proyecto tiene una vista de trazabilidad (`/projects/{id}/traces`)
- Vea el historial completo de actividad de agentes
- Inspeccione entradas, salidas, y razonamiento de cada agente

## 🔍 Transparencia y Auditoría

El sistema registra completamente:

- **Entrada y salida** de cada agente
- **Modelo LLM utilizado** para cada tarea
- **Tiempo de ejecución** y éxito/falla
- **Razonamiento** del agente para cada decisión
- **Fuentes** de cada dato extraído
- **Historial de versiones** de documentos

## 📈 KPIs y Métricas

### Por Proyecto:
- Porcentaje de completitud de documentos
- Puntaje promedio de calidad
- Documentos por estado
- Iteraciones promedio de feedback

### Globales:
- Total de proyectos y documentos
- Tasa de éxito de agentes
- Tiempo promedio de ejecución
- Distribución de estados

## 🛡️ Consideraciones de Seguridad

- Todos los archivos se almacenan localmente
- No se envían datos sensibles a servicios externos sin consentimiento
- Logs detallados para auditoría
- Validación de tipos de archivo

## 🔮 Roadmap

- [ ] Migración a base de datos PostgreSQL
- [ ] Despliegue en la nube
- [ ] Integración con APIs gubernamentales chilenas
- [ ] Agente de monitoreo de regulaciones
- [ ] Sistema de notificaciones
- [ ] Autenticación y roles de usuario
- [ ] Exportación de reportes en PDF

## 🤝 Contribuir

Este es un MVP para demostrar capacidades de agentes multi-LLM. Para mejoras:

1. Fork el repositorio
2. Cree una rama feature
3. Implemente sus cambios
4. Envíe un pull request

## 📄 Licencia

Este proyecto está bajo licencia MIT. Vea el archivo LICENSE para detalles.

## ⚠️ Descargo de Responsabilidad

Este sistema es para propósitos de demostración. Los documentos generados deben ser revisados por profesionales legales y técnicos antes de ser utilizados en procesos oficiales de permisos en Chile.