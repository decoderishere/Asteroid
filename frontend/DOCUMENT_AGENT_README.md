# Document Agent System - BESS Chile

## Overview

The Document Agent system provides AI-powered document generation for Chilean BESS permitting projects. It uses a plugin architecture with Anthropic Claude AI to generate professional regulatory documents.

## Setup

### 1. Environment Variables

#### Option A: Demo Mode (for testing)
Create `.env.local` with demo mode enabled:

```bash
# Demo mode for testing without API key
DEMO_MODE=true
```

#### Option B: Production Mode (with AI)
Add your Anthropic API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Get your API key from: https://console.anthropic.com/

### 2. Dependencies

All required dependencies are already installed:
- `@anthropic-ai/sdk` - Anthropic AI integration
- `yaml` - YAML configuration parsing  
- `zod` - Input validation

## Usage

### API Endpoint

**POST** `/api/documents/generate`

Generate documents using the Document Agent system.

#### Request Body
```json
{
  "docType": "environmental_study_chile_dia_v1",
  "projectId": "optional-project-id", 
  "input": {
    "project_name": "Sistema BESS Los Andes",
    "project_location": "Camino Los Andes KM 15",
    "commune": "Los Andes",
    "region": "Valparaíso", 
    "storage_capacity_mwh": 100,
    "power_capacity_mw": 50,
    "proponent_name": "Energía Verde SpA",
    "proponent_rut": "76.123.456-7",
    "technology_type": "Lithium-ion",
    "connection_voltage": "23 kV",
    "environmental_baseline": {
      "flora_fauna": "Vegetación esclerófila, sin especies protegidas",
      "soil_conditions": "Suelos de clase IV, uso agrícola",
      "water_resources": "Estero Los Andes a 500m",
      "air_quality": "Buena calidad, zona rural",
      "noise_levels": "< 40 dB ambiente rural"
    }
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "docType": "environmental_study_chile_dia_v1",
    "markdownUrl": "/documents/_tmp/environmental_study_chile_dia_v1/document.md",
    "markdown": "# DECLARACIÓN DE IMPACTO AMBIENTAL...",
    "projectId": "_tmp",
    "generatedAt": "2025-08-11T15:30:00.000Z"
  }
}
```

### Example cURL Request

```bash
curl -X POST http://localhost:3000/api/documents/generate \
  -H "Content-Type: application/json" \
  -d '{
    "docType": "environmental_study_chile_dia_v1",
    "input": {
      "project_name": "Sistema BESS Los Andes",
      "project_location": "Camino Los Andes KM 15", 
      "commune": "Los Andes",
      "region": "Valparaíso",
      "storage_capacity_mwh": 100,
      "power_capacity_mw": 50,
      "proponent_name": "Energía Verde SpA",
      "proponent_rut": "76.123.456-7",
      "technology_type": "Lithium-ion",
      "connection_voltage": "23 kV",
      "environmental_baseline": {
        "flora_fauna": "Vegetación esclerófila, sin especies protegidas",
        "soil_conditions": "Suelos de clase IV, uso agrícola", 
        "water_resources": "Estero Los Andes a 500m",
        "air_quality": "Buena calidad, zona rural",
        "noise_levels": "< 40 dB ambiente rural"
      }
    }
  }'
```

## Plugin System

### Available Plugins

#### environmental_study_chile_dia_v1
Generates **Declaración de Impacto Ambiental (DIA)** documents for Chilean BESS projects.

**Required Fields:**
- `project_name` - Official project name
- `project_location` - Physical location/address
- `commune` - Chilean commune  
- `region` - Chilean region
- `storage_capacity_mwh` - Energy capacity in MWh
- `power_capacity_mw` - Power capacity in MW
- `proponent_name` - Project proponent name
- `proponent_rut` - Proponent RUT
- `technology_type` - Battery technology
- `connection_voltage` - Grid connection voltage

### Plugin Architecture

Each plugin consists of:
- `spec.yaml` - Plugin specification and input validation schema
- `system_prompt.md` - AI system instructions for document generation
- `template.md` - Base template structure with placeholders

Plugins are registered in `config/documents.registry.yaml` and stored in `plugins/[plugin-id]/`.

## File Structure

```
├── config/
│   └── documents.registry.yaml    # Plugin registry
├── plugins/
│   └── environmental_study_chile_dia_v1/
│       ├── spec.yaml              # Plugin specification
│       ├── system_prompt.md       # AI system prompt
│       └── template.md            # Document template
├── src/
│   ├── lib/
│   │   ├── llm.ts                # Anthropic AI integration
│   │   └── docAgent/
│   │       └── orchestrator.ts   # Document generation orchestrator
│   └── app/api/documents/generate/
│       └── route.ts              # API endpoint
├── data/                         # Template and regulatory data
└── public/documents/            # Generated document outputs
```

## Development

### Adding New Plugins

1. Create plugin directory: `plugins/[plugin-id]/`
2. Add plugin specification: `spec.yaml`
3. Create AI prompt: `system_prompt.md`  
4. Design template: `template.md`
5. Register in `config/documents.registry.yaml`

### Testing

The system validates inputs against each plugin's JSON schema and generates professional documents using Claude AI with regulatory expertise.

Generated documents are saved to `public/documents/[project-id]/[doc-type]/document.md` and can be converted to PDF for official submission.