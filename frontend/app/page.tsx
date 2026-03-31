"use client";

import React, { useState } from 'react';
import { Upload, FileText, Download, Settings, Loader2, CheckCircle } from 'lucide-react';

export default function PDFCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [dpi, setDpi] = useState(150);
  const [isCompressing, setIsCompressing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // --- 請確認這裡換成你剛才產生的 Modal 網址 ---
  const MODAL_API_URL = "https://kimchang301--pdf-vibe-compressor-fastapi-app.modal.run/compress";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setDownloadUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsCompressing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${MODAL_API_URL}?dpi=${dpi}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('壓縮失敗');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      alert("發生錯誤，請稍後再試");
      console.error(error);
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 p-8 text-white text-center">
          <h1 className="text-3xl font-bold mb-2">EZ PDF Compressor</h1>
          <p className="opacity-80">在地端隱私處理，雲端強力壓縮</p>
        </div>

        <div className="p-8">
          {/* 上傳區 */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors bg-slate-50">
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              className="hidden" 
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-lg font-medium text-slate-700">
                {file ? file.name : "點擊或拖拽 PDF 檔案至此"}
              </p>
            </label>
          </div>

          {/* 設定區 */}
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Settings size={20} />
                解析度設定 (DPI): {dpi}
              </div>
              <input 
                type="range" min="72" max="300" step="10" 
                value={dpi} 
                onChange={(e) => setDpi(parseInt(e.target.value))}
                className="w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* 廣告位預留區 (這能幫你支付雲端費用) */}
            <div className="w-full h-24 bg-slate-100 rounded flex items-center justify-center border border-slate-200 text-slate-400 text-sm italic">
                贊助商廣告位 (AdSpace Placeholder)
            </div>

            {/* 按鈕 */}
            {!downloadUrl ? (
              <button 
                onClick={handleCompress}
                disabled={!file || isCompressing}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  !file || isCompressing ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isCompressing ? <Loader2 className="animate-spin" /> : "立即壓縮"}
                {isCompressing ? "處理中..." : "開始壓縮"}
              </button>
            ) : (
              <a 
                href={downloadUrl} 
                download={`compressed_${file?.name}`}
                className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} /> 下載壓縮檔案
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* 底部開源聲明 (滿足 AGPL 授權義務) */}
      <footer className="mt-12 text-center text-slate-400 text-sm">
        <p>本服務採用 Ghostscript 引擎。後端代碼已開源於 GitHub/kimchang301</p>
      </footer>
    </main>
  );
}