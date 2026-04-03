"""
File Upload Schemas
Pydantic models for file operations
"""

from pydantic import BaseModel
from typing import List


class FileUploadResponse(BaseModel):
    """File upload confirmation"""
    message: str
    file_url: str
    file_size: int
    file_type: str


class MultipleFileUploadResponse(BaseModel):
    """Multiple file upload response"""
    message: str
    files: List[FileUploadResponse]
    total_files: int