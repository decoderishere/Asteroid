"""Document processing agent for scanning and extracting content"""

import asyncio
import os
import mimetypes
from pathlib import Path
from typing import Dict, List, Any, Optional
import PyPDF2
from docx import Document

from .base import BaseAgent, EventType


class DocumentProcessor(BaseAgent):
    """Agent that scans and processes source documents"""
    
    def __init__(self, emitter, documents_path: str = "documents"):
        super().__init__("document_processor", emitter)
        self.documents_path = Path(documents_path)
    
    async def _execute(self, query: str, max_docs: int = 10, **kwargs) -> Dict[str, Any]:
        """Process documents and extract relevant content"""
        
        self.emit_step("scanning", "Scanning document directory")
        
        # Find all documents
        doc_files = self._find_documents()
        
        if not doc_files:
            self.emit_warning("No documents found to process")
            return {"processed_files": [], "extracted_content": []}
        
        # Limit to max_docs if specified
        if max_docs > 0:
            doc_files = doc_files[:max_docs]
        
        total_docs = len(doc_files)
        processed_files = []
        extracted_content = []
        
        self.emit_event(
            EventType.PROGRESS, 
            f"Found {total_docs} documents to process",
            {"total_docs": total_docs}
        )
        
        # Process each document
        for i, doc_path in enumerate(doc_files):
            self.emit_progress(i, total_docs, f"Processing {doc_path.name}")
            
            try:
                content = await self._extract_content(doc_path, query)
                if content:
                    processed_files.append(str(doc_path))
                    extracted_content.append(content)
                
                # Small delay to make progress visible
                await asyncio.sleep(0.1)
                
            except Exception as e:
                self.emit_warning(f"Failed to process {doc_path.name}: {str(e)}")
                continue
        
        self.emit_progress(total_docs, total_docs, "Document processing complete")
        
        return {
            "processed_files": processed_files,
            "extracted_content": extracted_content,
            "total_processed": len(processed_files),
            "total_found": total_docs
        }
    
    def _find_documents(self) -> List[Path]:
        """Find all supported document files"""
        if not self.documents_path.exists():
            return []
        
        supported_extensions = {'.pdf', '.docx', '.txt', '.md'}
        doc_files = []
        
        for file_path in self.documents_path.rglob('*'):
            if file_path.is_file() and file_path.suffix.lower() in supported_extensions:
                doc_files.append(file_path)
        
        # Sort by modification time (newest first)
        doc_files.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        return doc_files
    
    async def _extract_content(self, file_path: Path, query: str) -> Optional[Dict[str, Any]]:
        """Extract content from a document file"""
        
        try:
            if file_path.suffix.lower() == '.pdf':
                content = self._extract_pdf(file_path)
            elif file_path.suffix.lower() == '.docx':
                content = self._extract_docx(file_path)
            elif file_path.suffix.lower() in {'.txt', '.md'}:
                content = self._extract_text(file_path)
            else:
                return None
            
            if not content.strip():
                return None
            
            # For now, return all content. Later we could add query-based filtering
            return {
                "file_path": str(file_path),
                "file_name": file_path.name,
                "file_type": file_path.suffix.lower(),
                "content": content[:5000],  # Limit content length
                "full_length": len(content),
                "relevance_score": self._calculate_relevance(content, query)
            }
            
        except Exception as e:
            raise Exception(f"Failed to extract from {file_path.name}: {str(e)}")
    
    def _extract_pdf(self, file_path: Path) -> str:
        """Extract text from PDF file"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    def _extract_docx(self, file_path: Path) -> str:
        """Extract text from DOCX file"""
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    
    def _extract_text(self, file_path: Path) -> str:
        """Extract text from plain text file"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
            return file.read()
    
    def _calculate_relevance(self, content: str, query: str) -> float:
        """Calculate basic relevance score between content and query"""
        if not query.strip():
            return 0.5
        
        content_lower = content.lower()
        query_words = query.lower().split()
        
        matches = sum(1 for word in query_words if word in content_lower)
        return matches / len(query_words) if query_words else 0.0