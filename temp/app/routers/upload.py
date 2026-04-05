"""
Upload Router
Handles file uploads for nominations and documents
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from app.config import settings
from app.schemas.file_upload import FileUploadResponse, MultipleFileUploadResponse
from app.middleware.auth import get_current_user
from app.models import User
import os
import uuid
from typing import List

router = APIRouter()


def validate_file(file: UploadFile) -> None:
    """Validate uploaded file"""
    # Check file size
    if file.size and file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE // 1024 // 1024}MB"
        )
    
    # Check file extension
    if file.filename:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_FILE_TYPES)}"
            )


@router.post("/single", response_model=FileUploadResponse)
async def upload_single_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """
    Upload a single file
    
    - Requires authentication
    - Validates file type and size
    - Returns file URL for database storage
    """
    validate_file(file)
    
    # Ensure upload directory exists
    upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Return file URL (in production, this would be a CDN URL)
    file_url = f"/uploads/{unique_filename}"
    
    return {
        "message": "File uploaded successfully",
        "file_url": file_url,
        "file_size": len(content),
        "file_type": file_ext
    }


@router.post("/multiple", response_model=MultipleFileUploadResponse)
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    user: User = Depends(get_current_user)
):
    """
    Upload multiple files
    
    - Requires authentication
    - Maximum 5 files per request
    - Validates each file individually
    """
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 files allowed per upload"
        )
    
    uploaded_files = []
    
    for file in files:
        try:
            # Validate each file
            validate_file(file)
            
            # Ensure upload directory exists
            upload_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR)
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            # Add to results
            file_url = f"/uploads/{unique_filename}"
            uploaded_files.append({
                "message": f"File {file.filename} uploaded successfully",
                "file_url": file_url,
                "file_size": len(content),
                "file_type": file_ext
            })
            
        except HTTPException:
            raise  # Re-raise validation errors
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload {file.filename}: {str(e)}"
            )
    
    return {
        "message": f"Successfully uploaded {len(uploaded_files)} files",
        "files": uploaded_files,
        "total_files": len(uploaded_files)
    }