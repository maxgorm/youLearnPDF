from pydantic import BaseModel
from typing import List
import os

class Settings(BaseModel):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PDF Processing API"
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # API Configuration
    MAX_PDF_SIZE: int = 52428800  # 50MB in bytes
    MAX_PAGES: int = 2000
    MAX_REQUESTS_PER_SECOND: int = 1
    
    # Processing Configuration
    PROCESSING_TIMEOUT: int = 75  # seconds

    model_config = {
        "case_sensitive": True,
        "env_file": ".env"
    }

settings = Settings()
