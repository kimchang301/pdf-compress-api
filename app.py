import modal
import io
import os

# --- 1. 雲端環境定義 ---
image = (
    modal.Image.debian_slim()
    .apt_install("ghostscript")
    .pip_install("fastapi", "python-multipart", "uvicorn")
)

app = modal.App("pdf-vibe-compressor")

# --- 2. 核心壓縮邏輯 ---
@app.function(image=image)
def compress_pdf_logic(pdf_bytes: bytes, dpi: int = 150) -> bytes:
    import subprocess
    
    input_path = "input_temp.pdf"
    output_path = "output_temp.pdf"
    
    with open(input_path, "wb") as f:
        f.write(pdf_bytes)
    
    gs_command = [
        "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/default", "-dNOPAUSE", "-dQUIET", "-dBATCH",
        "-dColorImageDownsampleType=/Bicubic",
        f"-dColorImageResolution={dpi}",
        f"-dGrayImageResolution={dpi}",
        f"-dMonoImageResolution={dpi}",
        f"-sOutputFile={output_path}",
        input_path
    ]
    
    try:
        subprocess.run(gs_command, check=True)
        with open(output_path, "rb") as f:
            compressed_data = f.read()
    finally:
        if os.path.exists(input_path): os.remove(input_path)
        if os.path.exists(output_path): os.remove(output_path)
    
    return compressed_data

# --- 3. Web API 進入點 ---
@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, UploadFile, File, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    import urllib.parse

    web_app = FastAPI()

    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], 
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"]
    )

    @web_app.post("/compress")
    async def compress(file: UploadFile = File(...), dpi: int = Query(150)):
        pdf_content = await file.read()
        
        # 修正 1: 使用非同步方式呼叫 Modal (解決 AsyncUsageWarning)
        result_bytes = await compress_pdf_logic.remote.aio(pdf_content, dpi)
        
        # 修正 2: 處理中文字元檔名 (解決 UnicodeEncodeError)
        # 我們將檔名進行 URL 編碼，確保符合 HTTP Header 規範
        safe_filename = urllib.parse.quote(f"compressed_{file.filename}")
        
        return StreamingResponse(
            io.BytesIO(result_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename*=UTF-8''{safe_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    @web_app.get("/")
    def index():
        return {"status": "API is alive", "msg": "Ready to compress!"}

    return web_app