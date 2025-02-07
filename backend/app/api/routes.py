from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Any
from ..services.pdf_processor import PDFProcessor
from ..core.config import settings
import asyncio
import time

router = APIRouter()

class PDFRequest(BaseModel):
    url: HttpUrl

class PDFResponse(BaseModel):
    blocks: List[Dict[str, Any]]

# Rate limiting variables
last_request_time = 0

@router.post("/extract", response_model=PDFResponse)
async def extract_pdf(request: PDFRequest):
    """
    Extract text and bounding boxes from a PDF URL
    """
    global last_request_time
    
    # Rate limiting
    current_time = time.time()
    time_since_last_request = current_time - last_request_time
    if time_since_last_request < 1:  # 1 second between requests
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait before trying again."
        )
    last_request_time = current_time
    
    try:
        # Initialize PDF processor
        processor = PDFProcessor()
        
        # Process PDF with timeout
        try:
            blocks = await asyncio.wait_for(
                processor.process_pdf(str(request.url)),
                timeout=settings.PROCESSING_TIMEOUT
            )
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=408,
                detail=f"PDF processing exceeded {settings.PROCESSING_TIMEOUT} seconds timeout"
            )
        
        return PDFResponse(blocks=blocks)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_details = f"Error processing PDF: {str(e)}\nTraceback:\n{traceback.format_exc()}"
        print(error_details)  # This will show in the backend console
        raise HTTPException(status_code=500, detail=error_details)
