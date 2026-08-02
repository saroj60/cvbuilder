# Production-Ready Offline PDF Text Extraction Module

A high-performance, modular, and enterprise-grade offline PDF text extraction API built with **Node.js, Express.js, TypeScript, pdfjs-dist, Sharp, and Tesseract.js**.

---

## 🚀 Architecture & Features

- **Offline Processing**: 100% cloud-independent text extraction (No external API keys required).
- **Multi-Page PDF Support**: Converts each page into 300 DPI high-resolution PNG image buffers in parallel.
- **Image Preprocessing Service**:
  - **Grayscale Conversion** for text boundary isolation.
  - **Contrast Normalization** & histogram linear stretching.
  - **Adaptive Sharpening** to clean up blurry fonts and scanned noise.
  - **Auto-Rotation** based on EXIF metadata.
- **Confidence Scoring**: Returns page count, combined extracted text in page sequence, and weighted average confidence score (`%`).
- **File Validation & Limits**: Max file size 20 MB with MIME & magic byte check for PDF files.
- **Automatic Resource Cleanup**: Deletes all temporary disk buffers and worker threads post-processing.

---

## 📁 Directory Structure

```text
backend/src/
├── controllers/
│   └── ocr.controller.ts          # Input validation, 20MB check, error mapping & response
├── routes/
│   └── ocr.routes.ts              # Express router & Multer file upload setup
├── services/
│   ├── pdfConverter.service.ts    # PDF to 300 DPI PNG buffer converter
│   ├── imagePreprocessor.service.ts# Sharp-based image deskew, grayscale & contrast enhancer
│   └── ocrEngine.service.ts       # Offline Tesseract OCR recognition & worker lifecycle
├── app.ts                         # Main Express application setup & middleware
└── server.ts                      # Server bootstrap
```

---

## 🛠️ Installation & Setup Guide

### 1. Install Dependencies

```bash
cd backend
npm install tesseract.js sharp pdfjs-dist@3.11.174 canvas
```

### 2. Run in Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5000`.

---

## 📡 API Reference

### Extract Text from Scanned PDF

`POST /api/ocr/extract`

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: `[PDF File (Max 20MB)]`

#### Sample cURL Request

```bash
curl -X POST http://localhost:5000/api/ocr/extract \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/scanned_document.pdf"
```

#### Sample Success Response (`200 OK`)

```json
{
  "success": true,
  "pages": 2,
  "text": "--- PAGE 1 ---\nPASSPORT DETAILS\nName: RAM BAHADUR THAPA\nPassport No: N08492019\nDate of Birth: 15-06-1994\n\n--- PAGE 2 ---\nWORK EXPERIENCE\nPosition: Scaffolder\nCompany: KAEFER Saudi Arabia",
  "confidence": 97.5,
  "processingTimeMs": 1850
}
```

#### Error Responses

##### Invalid File Type (`400 Bad Request`)
```json
{
  "success": false,
  "error": "INVALID_FILE_TYPE",
  "message": "Unsupported format. Only image/scanned PDF files are supported."
}
```

##### File Exceeds 20MB (`400 Bad Request`)
```json
{
  "success": false,
  "error": "FILE_TOO_LARGE",
  "message": "File size exceeds maximum allowed threshold of 20MB. Uploaded file size: 24.50 MB."
}
```

##### Corrupted / Unreadable PDF (`422 Unprocessable Entity`)
```json
{
  "success": false,
  "error": "IMAGE_CONVERSION_FAILURE",
  "message": "Failed to convert PDF pages into images: Corrupted PDF file format"
}
```
