import fitz  # PyMuPDF
import requests
from PIL import Image
import pytesseract
import io
import numpy as np
from typing import List, Dict, Any, Tuple
import tempfile
import os
from ..core.config import settings

class PDFProcessor:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()

    async def download_pdf(self, url: str) -> str:
        """Download PDF from URL and save to temporary file"""
        try:
            print(f"Attempting to download PDF from: {url}")
            response = requests.get(url, timeout=30)
            
            # Log response details
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {response.headers}")
            
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            print(f"Content type: {content_type}")
            if 'pdf' not in content_type and 'octet-stream' not in content_type:
                raise ValueError(f"Invalid content type: {content_type}. Expected PDF.")
            
            # Check file size
            content_length = len(response.content)
            print(f"File size: {content_length} bytes")
            if content_length > settings.MAX_PDF_SIZE:
                raise ValueError(f"PDF size exceeds maximum allowed size of {settings.MAX_PDF_SIZE // 1048576}MB")
            
            # Save to temporary file
            temp_path = os.path.join(self.temp_dir, 'temp.pdf')
            print(f"Saving PDF to: {temp_path}")
            with open(temp_path, 'wb') as f:
                f.write(response.content)
            
            # Verify file was saved
            if not os.path.exists(temp_path):
                raise ValueError("Failed to save PDF file")
                
            print(f"PDF successfully downloaded and saved to: {temp_path}")
            return temp_path
        except requests.RequestException as e:
            print(f"Request error: {str(e)}")
            raise ValueError(f"Failed to download PDF: {str(e)}")
        except Exception as e:
            print(f"Unexpected error during download: {str(e)}")
            raise ValueError(f"Failed to process PDF: {str(e)}")

    async def process_page(self, page: fitz.Page) -> List[Dict[str, Any]]:
        """Process a single page and extract text with bounding boxes"""
        blocks = []
        
        # First try to extract searchable text
        text_blocks = page.get_text("dict")["blocks"]
        
        if text_blocks:  # If searchable text exists
            for block in text_blocks:
                if "lines" in block:
                    for line in block["lines"]:
                        # Combine all spans in a line
                        line_text = " ".join(span["text"].strip() for span in line["spans"] if span["text"].strip())
                        if line_text:
                            # Use the bounding box of the entire line
                            bbox = [
                                min(span["bbox"][0] for span in line["spans"]),  # leftmost x
                                min(span["bbox"][1] for span in line["spans"]),  # topmost y
                                max(span["bbox"][2] for span in line["spans"]),  # rightmost x
                                max(span["bbox"][3] for span in line["spans"])   # bottommost y
                            ]
                            blocks.append({
                                "text": line_text,
                                "bbox": list(bbox)
                            })
        else:  # If no searchable text, perform OCR
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Perform OCR
            ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
            
            # Convert OCR results to our format
            for i in range(len(ocr_data["text"])):
                text = ocr_data["text"][i]
                if text.strip():
                    x = ocr_data["left"][i]
                    y = ocr_data["top"][i]
                    w = ocr_data["width"][i]
                    h = ocr_data["height"][i]
                    
                    # Convert coordinates to PDF coordinate system
                    bbox = [x, y, x + w, y + h]
                    blocks.append({
                        "text": text,
                        "bbox": bbox
                    })
        
        return blocks

    async def process_pdf(self, url: str) -> List[Dict[str, Any]]:
        """Process PDF and extract text with bounding boxes"""
        temp_path = await self.download_pdf(url)
        
        try:
            doc = fitz.open(temp_path)
            
            # Check page count
            if doc.page_count > settings.MAX_PAGES:
                raise ValueError(f"PDF exceeds maximum allowed pages ({settings.MAX_PAGES})")
            
            all_blocks = []
            
            # Process each page
            for page_num in range(doc.page_count):
                page = doc[page_num]
                blocks = await self.process_page(page)
                
                # Add page number to blocks
                for block in blocks:
                    block["page"] = page_num + 1
                
                all_blocks.extend(blocks)
            
            return all_blocks
        
        finally:
            # Cleanup
            try:
                # Close the document if it exists
                if 'doc' in locals():
                    doc.close()
                # Remove the temporary file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except Exception as e:
                print(f"Error during cleanup: {str(e)}")
