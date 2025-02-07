# PDF Upload and Extract System

A web application that allows users to upload PDF URLs, extract text with bounding boxes, and view the results with interactive highlighting.

## Features

- Upload PDFs via URL
- Extract text with accurate bounding boxes
- OCR support for non-searchable PDFs
- Interactive PDF viewer with zoom support
- Side-by-side transcript view
- Synchronized highlighting between PDF and transcript
- Rate limiting and file size restrictions

## Tech Stack

- Frontend:
  - Next.js 14/15
  - TypeScript
  - Tailwind CSS
  - react-pdf-viewer
  - react-markdown

- Backend:
  - Python
  - FastAPI
  - PyMuPDF
  - Tesseract OCR
  - Docker support

## Prerequisites

- Node.js (v18.18.0 or higher)
- Python (v3.11 or higher)
- Tesseract OCR (for OCR support)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd youLearnProject
   ```

2. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # On Windows
   source venv/bin/activate     # On Unix/macOS
   pip install -r requirements.txt
   ```

## Running the Application

1. Start both frontend and backend services:
   ```bash
   cd frontend
   npm run dev:all
   ```

   This will start:
   - Frontend at http://localhost:3000
   - Backend at http://localhost:8000

2. Open your browser and navigate to http://localhost:3000

## Usage

1. Enter a PDF URL in the input field
2. Click "Extract Text" to process the PDF
3. View the PDF and extracted text side by side
4. Click on text in either panel to highlight the corresponding section

## API Endpoints

- `POST /api/v1/extract`
  - Request body: `{ "url": "string" }`
  - Response: `{ "blocks": [ { "text": "string", "bbox": [x0, y0, x1, y1], "page": number } ] }`

## Performance

- Processing time: < 75 seconds per PDF
- Maximum PDF size: 50MB
- Maximum page count: 2000 pages
- Rate limiting: 1 request per second

## Docker Support

Build and run the backend using Docker:

```bash
cd backend
docker build -t pdf-processor .
docker run -p 8000:8000 pdf-processor
```

## Test PDFs

You can test the application with these sample PDFs:
- https://youlearn-content-uploads.s3.amazonaws.com/content/b5671201db3042a08a93deaab2e3b8e7.pdf
- https://youlearn-content-uploads.s3.amazonaws.com/content/415b1580950a41ff886333c789eee7eb.pdf
