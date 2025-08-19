"""Content generation agent using LLM"""

import asyncio
import os
from typing import Dict, List, Any, Optional
import requests
import json

from .base import BaseAgent, EventType


class ContentGenerator(BaseAgent):
    """Agent that generates document sections using LLM"""
    
    def __init__(self, emitter):
        super().__init__("content_generator", emitter)
        self.api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENROUTER_API_KEY")
        self.use_mock = not self.api_key
        
        if self.use_mock:
            self.emit_warning("No API key found, using mock responses")
    
    async def _execute(
        self, 
        extracted_content: List[Dict[str, Any]], 
        query: str, 
        document_type: str = "environmental_study_chile_dia_v1",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate document content based on extracted information"""
        
        self.emit_step("analysis", "Analyzing source content")
        
        if not extracted_content:
            self.emit_warning("No content to analyze, generating basic template")
            return await self._generate_basic_template(document_type, query)
        
        # Prepare content summary
        content_summary = self._summarize_content(extracted_content)
        
        self.emit_step("generation", "Generating document sections")
        
        # Generate different sections
        sections = [
            ("executive_summary", "Executive Summary"),
            ("introduction", "Introduction and Background"),
            ("project_description", "Project Description"),
            ("environmental_impact", "Environmental Impact Assessment"),
            ("mitigation_measures", "Mitigation Measures"),
            ("monitoring_plan", "Monitoring and Follow-up Plan"),
            ("conclusions", "Conclusions")
        ]
        
        generated_sections = {}
        
        for i, (section_id, section_title) in enumerate(sections):
            self.emit_progress(i, len(sections), f"Generating {section_title}")
            
            try:
                if self.use_mock:
                    section_content = await self._generate_mock_section(
                        section_id, section_title, content_summary, query
                    )
                else:
                    section_content = await self._generate_llm_section(
                        section_id, section_title, content_summary, query, document_type
                    )
                
                generated_sections[section_id] = {
                    "title": section_title,
                    "content": section_content,
                    "confidence": 0.85 if not self.use_mock else 0.3
                }
                
                # Small delay between sections
                await asyncio.sleep(0.2)
                
            except Exception as e:
                self.emit_warning(f"Failed to generate {section_title}: {str(e)}")
                generated_sections[section_id] = {
                    "title": section_title,
                    "content": f"[Error generating section: {str(e)}]",
                    "confidence": 0.0
                }
        
        self.emit_progress(len(sections), len(sections), "Content generation complete")
        
        return {
            "sections": generated_sections,
            "document_type": document_type,
            "source_files": len(extracted_content),
            "query": query,
            "using_mock": self.use_mock
        }
    
    def _summarize_content(self, extracted_content: List[Dict[str, Any]]) -> str:
        """Create a summary of all extracted content"""
        summary_parts = []
        
        for item in extracted_content[:5]:  # Limit to top 5 most relevant
            summary_parts.append(
                f"From {item['file_name']} ({item['file_type']}): "
                f"{item['content'][:500]}..."
            )
        
        return "\n\n".join(summary_parts)
    
    async def _generate_mock_section(
        self, 
        section_id: str, 
        section_title: str, 
        content_summary: str, 
        query: str
    ) -> str:
        """Generate mock content for a section"""
        
        mock_templates = {
            "executive_summary": f"""
## Resumen Ejecutivo

El presente estudio corresponde a la Declaración de Impacto Ambiental (DIA) del proyecto "{query}" ubicado en la región central de Chile.

**Características principales:**
- Proyecto: Sistema de almacenamiento de energía con baterías (BESS)
- Capacidad: 100 MWh
- Potencia: 50 MW
- Tecnología: Ion-litio

**Conclusión:** Los impactos ambientales identificados son NO SIGNIFICATIVOS, por lo que corresponde su aprobación mediante Resolución de Calificación Ambiental (RCA) favorable.
""",
            "project_description": f"""
## Descripción del Proyecto

### 2.1 Información General
- **Nombre del Proyecto:** {query}
- **Tipo:** Sistema de Almacenamiento de Energía con Baterías (BESS)
- **Ubicación:** Región Metropolitana, Chile
- **Proponente:** [Datos del titular]

### 2.2 Componentes Técnicos
El proyecto considera la instalación de:
1. Módulos de baterías de ion-litio (100 MWh)
2. Inversores bidireccionales DC/AC (50 MW)
3. Transformadores elevadores 0.4/220 kV
4. Sistema de control y monitoreo SCADA
5. Infraestructura de apoyo (casetas, caminos, cercos)
""",
            "environmental_impact": """
## Evaluación de Impactos Ambientales

### 3.1 Medio Físico

#### Componente Aire
- **Impacto:** NO SIGNIFICATIVO
- **Descripción:** Emisiones menores durante construcción, sin emisiones en operación
- **Medidas:** Control de polvo durante obras

#### Componente Suelo
- **Impacto:** NO SIGNIFICATIVO  
- **Descripción:** Alteración superficial mínima
- **Medidas:** Delimitación de áreas de trabajo

#### Componente Agua
- **Impacto:** NO SIGNIFICATIVO
- **Descripción:** Consumo mínimo para actividades de construcción
- **Medidas:** Uso eficiente del recurso hídrico
"""
        }
        
        return mock_templates.get(section_id, f"### {section_title}\n\n[Contenido generado para {section_id}]\n\nEste es contenido de ejemplo generado sin conexión a LLM real.")
    
    async def _generate_llm_section(
        self,
        section_id: str,
        section_title: str, 
        content_summary: str,
        query: str,
        document_type: str
    ) -> str:
        """Generate content using real LLM API"""
        
        prompt = f"""
You are writing a section for a Chilean environmental impact assessment (DIA) document.

Document Type: {document_type}
Section: {section_title}
Project Query: {query}

Source Information:
{content_summary}

Requirements:
- Write in Spanish
- Follow Chilean environmental regulations
- Use professional, technical language
- Structure with proper headings and subsections
- Focus on BESS (Battery Energy Storage System) projects
- Include specific technical details when available

Generate a comprehensive {section_title} section in markdown format:
"""
        
        try:
            if self.api_key and "anthropic" in str(self.api_key).lower():
                return await self._call_anthropic_api(prompt)
            elif self.api_key:
                return await self._call_openrouter_api(prompt)
            else:
                return await self._generate_mock_section(section_id, section_title, content_summary, query)
                
        except Exception as e:
            self.emit_warning(f"LLM API call failed: {str(e)}")
            return await self._generate_mock_section(section_id, section_title, content_summary, query)
    
    async def _call_anthropic_api(self, prompt: str) -> str:
        """Call Anthropic Claude API"""
        # This would implement the actual API call
        # For now, return mock content
        await asyncio.sleep(0.5)  # Simulate API delay
        return "[Real Anthropic API content would be generated here]"
    
    async def _call_openrouter_api(self, prompt: str) -> str:
        """Call OpenRouter API"""
        # This would implement the actual API call
        # For now, return mock content  
        await asyncio.sleep(0.5)  # Simulate API delay
        return "[Real OpenRouter API content would be generated here]"
    
    async def _generate_basic_template(self, document_type: str, query: str) -> Dict[str, Any]:
        """Generate basic template when no source content is available"""
        
        basic_sections = {
            "executive_summary": {
                "title": "Resumen Ejecutivo",
                "content": f"Resumen ejecutivo para el proyecto {query}",
                "confidence": 0.2
            },
            "project_description": {
                "title": "Descripción del Proyecto", 
                "content": f"Descripción técnica del proyecto {query}",
                "confidence": 0.2
            }
        }
        
        return {
            "sections": basic_sections,
            "document_type": document_type,
            "source_files": 0,
            "query": query,
            "using_mock": True
        }