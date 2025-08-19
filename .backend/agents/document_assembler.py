"""Document assembly agent for creating final documents"""

import asyncio
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import json

from .base import BaseAgent, EventType


class DocumentAssembler(BaseAgent):
    """Agent that assembles final documents from generated sections"""
    
    def __init__(self, emitter, output_path: str = "documents"):
        super().__init__("document_assembler", emitter)
        self.output_path = Path(output_path)
        self.output_path.mkdir(exist_ok=True)
    
    async def _execute(
        self, 
        generated_sections: Dict[str, Any],
        query: str,
        document_type: str = "environmental_study_chile_dia_v1",
        **kwargs
    ) -> Dict[str, Any]:
        """Assemble final documents from generated sections"""
        
        self.emit_step("assembly", "Assembling final document")
        
        sections = generated_sections.get("sections", {})
        if not sections:
            raise ValueError("No sections provided for assembly")
        
        # Generate document metadata
        metadata = self._generate_metadata(query, document_type, generated_sections)
        
        self.emit_progress(1, 4, "Creating markdown version")
        markdown_content = await self._create_markdown_document(sections, metadata)
        
        self.emit_progress(2, 4, "Creating HTML version") 
        html_content = await self._create_html_document(sections, metadata)
        
        self.emit_progress(3, 4, "Saving documents")
        file_paths = await self._save_documents(
            markdown_content, html_content, query, document_type
        )
        
        self.emit_progress(4, 4, "Document assembly complete")
        
        return {
            "markdown": markdown_content,
            "html": html_content,
            "files": file_paths,
            "metadata": metadata,
            "sections_count": len(sections),
            "document_type": document_type
        }
    
    def _generate_metadata(
        self, 
        query: str, 
        document_type: str, 
        generated_sections: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate document metadata"""
        
        return {
            "title": f"Declaración de Impacto Ambiental - {query}",
            "project_name": query,
            "document_type": document_type,
            "generated_date": datetime.now().strftime("%d-%m-%Y"),
            "generated_datetime": datetime.now().isoformat(),
            "source_files": generated_sections.get("source_files", 0),
            "sections_count": len(generated_sections.get("sections", {})),
            "using_mock": generated_sections.get("using_mock", False)
        }
    
    async def _create_markdown_document(
        self, 
        sections: Dict[str, Any], 
        metadata: Dict[str, Any]
    ) -> str:
        """Create markdown version of the document"""
        
        # Document header
        markdown_lines = [
            f"# {metadata['title'].upper()}",
            f"## PROYECTO SISTEMA DE ALMACENAMIENTO DE ENERGÍA CON BATERÍAS (BESS)",
            "",
            f"**Nombre del Proyecto:** {metadata['project_name']}",
            f"**Proponente:** [Información del titular]",
            f"**RUT:** [RUT del titular]",
            f"**Fecha:** {metadata['generated_date']}",
            "",
            "---",
            ""
        ]
        
        # Add sections in logical order
        section_order = [
            "executive_summary",
            "introduction", 
            "project_description",
            "environmental_impact",
            "mitigation_measures",
            "monitoring_plan", 
            "conclusions"
        ]
        
        section_counter = 1
        for section_id in section_order:
            if section_id in sections:
                section = sections[section_id]
                markdown_lines.extend([
                    f"## {section_counter}. {section['title'].upper()}",
                    "",
                    section['content'],
                    "",
                    "---",
                    ""
                ])
                section_counter += 1
        
        # Add any remaining sections not in the standard order
        for section_id, section in sections.items():
            if section_id not in section_order:
                markdown_lines.extend([
                    f"## {section_counter}. {section['title'].upper()}",
                    "",
                    section['content'], 
                    "",
                    "---",
                    ""
                ])
                section_counter += 1
        
        # Document footer
        footer_note = "**[DOCUMENTO GENERADO USANDO SISTEMA DE AGENTES]**"
        if metadata["using_mock"]:
            footer_note += "  \n**Para usar AI real, configure API key en variables de entorno**"
        
        markdown_lines.extend([
            footer_note,
            "",
            f"**{metadata['project_name']}**  ",
            f"**{metadata['generated_date']}**"
        ])
        
        await asyncio.sleep(0.1)  # Small delay for progress visibility
        return "\n".join(markdown_lines)
    
    async def _create_html_document(
        self, 
        sections: Dict[str, Any], 
        metadata: Dict[str, Any]
    ) -> str:
        """Create HTML version suitable for export to Word/PDF"""
        
        html_template = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{metadata['title']}</title>
    <style>
        body {{
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }}
        h1 {{
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 30px;
            text-transform: uppercase;
        }}
        h2 {{
            font-size: 16pt;
            font-weight: bold;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
        }}
        h3 {{
            font-size: 14pt;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }}
        p {{
            margin-bottom: 12px;
            text-align: justify;
        }}
        .document-header {{
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
        }}
        .metadata {{
            margin-bottom: 30px;
        }}
        .metadata p {{
            margin: 5px 0;
            font-weight: bold;
        }}
        .section {{
            margin-bottom: 40px;
            page-break-inside: avoid;
        }}
        .footer {{
            margin-top: 50px;
            text-align: center;
            font-style: italic;
            border-top: 1px solid #666;
            padding-top: 20px;
        }}
        hr {{
            border: none;
            border-top: 1px solid #ccc;
            margin: 30px 0;
        }}
        ul, ol {{
            margin-left: 30px;
        }}
        li {{
            margin-bottom: 5px;
        }}
        @media print {{
            body {{ margin: 0; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="document-header">
        <h1>{metadata['title']}</h1>
        <h2 style="border: none; text-align: center;">Proyecto Sistema de Almacenamiento de Energía con Baterías (BESS)</h2>
    </div>
    
    <div class="metadata">
        <p><strong>Nombre del Proyecto:</strong> {metadata['project_name']}</p>
        <p><strong>Proponente:</strong> [Información del titular]</p>
        <p><strong>RUT:</strong> [RUT del titular]</p>
        <p><strong>Fecha:</strong> {metadata['generated_date']}</p>
    </div>
    
    <hr>
"""
        
        # Add sections
        section_order = [
            "executive_summary",
            "introduction",
            "project_description", 
            "environmental_impact",
            "mitigation_measures",
            "monitoring_plan",
            "conclusions"
        ]
        
        section_counter = 1
        for section_id in section_order:
            if section_id in sections:
                section = sections[section_id]
                # Convert markdown to basic HTML
                content_html = self._markdown_to_html(section['content'])
                
                html_template += f"""
    <div class="section">
        <h2>{section_counter}. {section['title']}</h2>
        {content_html}
    </div>
    <hr>
"""
                section_counter += 1
        
        # Add footer
        footer_note = "<strong>[DOCUMENTO GENERADO USANDO SISTEMA DE AGENTES]</strong>"
        if metadata["using_mock"]:
            footer_note += "<br><strong>Para usar AI real, configure API key en variables de entorno</strong>"
        
        html_template += f"""
    <div class="footer">
        <p>{footer_note}</p>
        <p><strong>{metadata['project_name']}</strong></p>
        <p><strong>{metadata['generated_date']}</strong></p>
    </div>
</body>
</html>"""
        
        await asyncio.sleep(0.1)  # Small delay for progress visibility
        return html_template
    
    def _markdown_to_html(self, markdown_text: str) -> str:
        """Convert basic markdown to HTML"""
        lines = markdown_text.split('\n')
        html_lines = []
        
        in_list = False
        
        for line in lines:
            line = line.strip()
            
            if not line:
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                html_lines.append('<br>')
                continue
            
            # Handle headers
            if line.startswith('###'):
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                html_lines.append(f'<h3>{line[3:].strip()}</h3>')
            elif line.startswith('##'):
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                html_lines.append(f'<h2>{line[2:].strip()}</h2>')
            elif line.startswith('#'):
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                html_lines.append(f'<h1>{line[1:].strip()}</h1>')
            
            # Handle lists
            elif line.startswith('- ') or line.startswith('* '):
                if not in_list:
                    html_lines.append('<ul>')
                    in_list = True
                html_lines.append(f'<li>{line[2:].strip()}</li>')
            
            # Handle bold text
            elif '**' in line:
                line = line.replace('**', '<strong>').replace('</strong>', '</strong>')
                # Fix any broken bold tags
                bold_count = line.count('<strong>')
                if bold_count % 2 == 1:
                    line += '</strong>'
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                html_lines.append(f'<p>{line}</p>')
            
            # Regular paragraph
            else:
                if in_list:
                    html_lines.append('</ul>')
                    in_list = False
                html_lines.append(f'<p>{line}</p>')
        
        if in_list:
            html_lines.append('</ul>')
        
        return '\n'.join(html_lines)
    
    async def _save_documents(
        self,
        markdown_content: str,
        html_content: str, 
        query: str,
        document_type: str
    ) -> Dict[str, str]:
        """Save documents to filesystem"""
        
        # Create safe filename
        safe_name = "".join(c for c in query if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_name = safe_name.replace(' ', '_').lower()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create directory for this run
        run_dir = self.output_path / f"{safe_name}_{timestamp}"
        run_dir.mkdir(exist_ok=True)
        
        # Save files
        markdown_file = run_dir / "document.md"
        html_file = run_dir / "document.html"
        metadata_file = run_dir / "metadata.json"
        
        # Write files
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        with open(html_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # Save metadata
        metadata = {
            "query": query,
            "document_type": document_type,
            "generated_at": datetime.now().isoformat(),
            "files": {
                "markdown": str(markdown_file),
                "html": str(html_file)
            }
        }
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        await asyncio.sleep(0.1)  # Small delay for progress visibility
        
        return {
            "markdown": str(markdown_file),
            "html": str(html_file),
            "metadata": str(metadata_file),
            "directory": str(run_dir)
        }