import os
import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from .base_agent import BaseAgent
from schemas import AgentInput, AgentOutput
from models import ProjectFile
import PyPDF2
from docx import Document as DocxDocument
import email
from email import policy
import mimetypes

class IngestionAgent(BaseAgent):
    def __init__(self, openrouter_client):
        super().__init__("IngestionAgent", openrouter_client)
        self.supported_formats = {
            'application/pdf': self._process_pdf,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': self._process_docx,
            'message/rfc822': self._process_email,
            'text/plain': self._process_text
        }
    
    def process(self, input_data: AgentInput, db: Session) -> AgentOutput:
        try:
            file_data = input_data.input_data
            project_id = input_data.project_id
            
            # Save file to filesystem
            file_path = self._save_uploaded_file(file_data, project_id)
            
            # Create database record
            project_file = ProjectFile(
                project_id=project_id,
                filename=file_data['filename'],
                file_path=file_path,
                file_type=file_data.get('file_type', 'unknown'),
                file_size=len(file_data.get('content', b'')),
                origin=file_data.get('origin', 'user_uploaded')
            )
            db.add(project_file)
            db.commit()
            
            # Extract content based on file type
            content = self._extract_content(file_path, file_data.get('file_type'))
            
            # Use LLM to extract structured data
            extracted_data = self._extract_structured_data(content, file_data['filename'])
            
            # Update database record with extracted data
            project_file.extracted_data = extracted_data
            project_file.processed = True
            db.commit()
            
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=project_id,
                output_data={
                    "file_id": project_file.id,
                    "extracted_data": extracted_data,
                    "file_path": file_path,
                    "content_preview": content[:500] if content else ""
                },
                model_used=self.openrouter_client.get_optimal_model("ingestion"),
                reasoning="Successfully extracted and structured data from uploaded file",
                execution_time=0.0,
                success=True
            )
            
        except Exception as e:
            return AgentOutput(
                agent_name=self.name,
                task_type=input_data.task_type,
                project_id=input_data.project_id,
                output_data={},
                model_used="error",
                reasoning=f"Failed to process file: {str(e)}",
                execution_time=0.0,
                success=False,
                error_message=str(e)
            )
    
    def _save_uploaded_file(self, file_data: Dict[str, Any], project_id: str) -> str:
        # Create project-specific directory structure
        project_dir = f"projects/{project_id}"
        uploads_dir = os.path.join(project_dir, "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        
        # Also create other directories for organization
        os.makedirs(os.path.join(project_dir, "generated"), exist_ok=True)
        os.makedirs(os.path.join(project_dir, "coordinator"), exist_ok=True)
        
        # Determine target directory based on origin
        origin = file_data.get('origin', 'user_uploaded')
        if origin == 'ai_generated':
            target_dir = os.path.join(project_dir, "generated")
        elif origin == 'coordinator_provided':
            target_dir = os.path.join(project_dir, "coordinator")
        else:
            target_dir = uploads_dir
        
        file_path = os.path.join(target_dir, file_data['filename'])
        
        with open(file_path, 'wb') as f:
            content = file_data.get('content')
            if isinstance(content, str):
                f.write(content.encode('utf-8'))
            else:
                f.write(content or b'')
        
        return file_path
    
    def _extract_content(self, file_path: str, file_type: str = None) -> str:
        if not file_type:
            # Detect file type using mimetypes and file extension
            file_type, _ = mimetypes.guess_type(file_path)
            if not file_type:
                # Fallback based on file extension
                ext = os.path.splitext(file_path)[1].lower()
                if ext == '.pdf':
                    file_type = 'application/pdf'
                elif ext in ['.docx']:
                    file_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                elif ext in ['.doc']:
                    file_type = 'application/msword'
                elif ext == '.txt':
                    file_type = 'text/plain'
                elif ext == '.eml':
                    file_type = 'message/rfc822'
                else:
                    file_type = 'text/plain'  # Default fallback
        
        processor = self.supported_formats.get(file_type, self._process_text)
        return processor(file_path)
    
    def _process_pdf(self, file_path: str) -> str:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _process_docx(self, file_path: str) -> str:
        doc = DocxDocument(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    
    def _process_email(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            msg = email.message_from_file(f, policy=policy.default)
        
        content = f"Subject: {msg.get('Subject', 'No Subject')}\n"
        content += f"From: {msg.get('From', 'Unknown')}\n"
        content += f"Date: {msg.get('Date', 'Unknown')}\n\n"
        
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain":
                    content += part.get_content()
        else:
            content += msg.get_content()
        
        return content
    
    def _process_text(self, file_path: str) -> str:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    
    def _extract_structured_data(self, content: str, filename: str) -> Dict[str, Any]:
        system_message = self.openrouter_client.create_system_message(
            """You are an expert document analyzer for Chilean BESS permitting projects. 
            Extract key structured data from the provided document content.
            
            Focus on identifying:
            1. Project details (name, location, capacity, substation info)
            2. Technical specifications (voltage levels, equipment types, ratings)
            3. Environmental data (coordinates, land use, environmental impact)
            4. Regulatory information (permit types needed, compliance requirements)
            5. Timeline information (project phases, milestones, deadlines)
            6. Contact information (developers, consultants, authorities)
            
            Return a JSON object with the extracted information, using null for missing data.
            Be specific about Chilean regulatory context where applicable."""
        )
        
        user_message = self.openrouter_client.create_user_message(
            f"Filename: {filename}\n\nDocument Content:\n{content[:8000]}"  # Limit content size
        )
        
        response = self.openrouter_client.chat_completion(
            messages=[system_message, user_message],
            task_type="ingestion",
            temperature=0.3
        )
        
        if response["success"]:
            try:
                # Try to parse the JSON response
                content = response["data"]["choices"][0]["message"]["content"]
                # Extract JSON from response if it's wrapped in text
                if "```json" in content:
                    json_start = content.find("```json") + 7
                    json_end = content.find("```", json_start)
                    json_str = content[json_start:json_end].strip()
                else:
                    json_str = content.strip()
                
                return json.loads(json_str)
            except json.JSONDecodeError:
                # Fallback to basic extraction
                return {
                    "raw_content": content[:1000],
                    "filename": filename,
                    "extraction_error": "Failed to parse LLM JSON response",
                    "llm_response": response["data"]["choices"][0]["message"]["content"][:500]
                }
        else:
            return {
                "filename": filename,
                "extraction_error": "LLM call failed",
                "error_details": response.get("error", "Unknown error")
            }