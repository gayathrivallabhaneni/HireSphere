"""
Validators for file uploads and data integrity.
"""
import os
import uuid
from django.core.exceptions import ValidationError
from django.conf import settings


ALLOWED_RESUME_EXTENSIONS = {'.pdf', '.docx'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/octet-stream'  # fallback handled with extension validation
}

def validate_resume_file(file):
    """
    Validate that an uploaded resume is either a PDF or DOCX file
    and doesn't exceed the configured maximum size (default 5MB).
    """
    max_mb = getattr(settings, 'MAX_RESUME_SIZE_MB', 5)
    max_bytes = max_mb * 1024 * 1024

    if file.size > max_bytes:
        raise ValidationError(f"File size exceeds the maximum limit of {max_mb}MB.")

    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_RESUME_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file format '{ext}'. Only PDF and DOCX files are allowed."
        )

    # Basic magic number / signature check
    try:
        file.seek(0)
        header = file.read(4)
        file.seek(0)
        if ext == '.pdf' and not header.startswith(b'%PDF'):
            raise ValidationError("Invalid PDF file structure.")
        elif ext == '.docx' and not header.startswith(b'PK\x03\x04'):
            raise ValidationError("Invalid DOCX file structure.")
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        # If seek fails, proceed with extension validation
        pass

    return file


def resume_upload_path(instance, filename):
    """
    Generate a secure, randomized filename to prevent directory traversal
    and filename collision attacks.
    """
    ext = os.path.splitext(filename)[1].lower()
    clean_uuid = uuid.uuid4().hex
    user_id = getattr(instance, 'user_id', 'anon')
    return f"resumes/{user_id}/{clean_uuid}{ext}"
