import React, { useState, useCallback, useRef } from 'react';
import { FileProcessResult } from '../types';
import { FileIcon } from './icons/FileIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface FileUploadProps {
  onFileProcess: (result: FileProcessResult) => void;
  isLoading: boolean;
  loadingMessage: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess, isLoading, loadingMessage }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const readPdfText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (window as any).pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map((s: any) => s.str).join(' ');
    }
    return textContent;
  };

  // New function to handle scanned PDFs by rendering them as an image.
  const renderPdfPageAsImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (window as any).pdfjsLib.getDocument(arrayBuffer).promise;

    if (pdf.numPages === 0) {
        return ''; // Return empty string if no pages
    }
    
    // Process only the first page for simplicity and performance.
    const page = await pdf.getPage(1);
    // Use a higher scale for better image quality, which improves vision model analysis.
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) {
        throw new Error("Could not get canvas context to render PDF page.");
    }

    const renderContext = {
        canvasContext: context,
        viewport: viewport
    };

    await page.render(renderContext).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    return dataUrl.split(',')[1];
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      let content: string;
      let mimeType = file.type; // Use 'let' to allow modification for scanned PDFs.

      if (mimeType.startsWith('image/')) {
        content = await readFileAsBase64(file);
      } else if (mimeType === 'application/pdf') {
        content = await readPdfText(file);
        // If PDF text extraction fails, it's likely a scanned PDF.
        // We'll render the first page as an image and process that instead.
        if (!content.trim()) {
          console.log("PDF text content is empty. Attempting to render as image.");
          content = await renderPdfPageAsImage(file);
          if (content) {
            mimeType = 'image/jpeg'; // Update mimeType to reflect the content change.
          }
        }
      } else if (mimeType === 'text/plain') {
        content = await readFileAsText(file);
      } else {
        throw new Error('Unsupported file type. Please upload a TXT, PDF, or image file.');
      }
      
      // Final check to ensure we have some content to process, regardless of the source.
      if (!content || !content.trim()) {
        throw new Error('The document appears to be empty or its content could not be read. Please try another file.');
      }

      onFileProcess({ content, mimeType, name: file.name });

    } catch (err) {
      console.error('File processing error:', err);
      setError((err as Error).message || 'Failed to read the file.');
    } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [onFileProcess]);

  return (
    <div className="w-full max-w-lg mx-auto text-center">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8">
                <SpinnerIcon className="h-12 w-12 mb-4" />
                <p className="text-lg text-slate-300">{loadingMessage}</p>
            </div>
        ) : (
          <div>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-cyan-400 transition-colors duration-300">
                <FileIcon className="mx-auto h-12 w-12 text-slate-500" />
                <h2 className="mt-4 text-xl font-semibold text-slate-200">Upload Your Study Material</h2>
                <p className="mt-2 text-sm text-slate-400">Drag and drop or click to upload (TXT, PDF, JPG, PNG)</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".txt, .pdf, image/png, image/jpeg"
                    className="hidden"
                    id="file-upload"
                    disabled={isLoading}
                />
                <label
                    htmlFor="file-upload"
                    className="mt-6 inline-block bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-500 transition-colors cursor-pointer"
                >
                    Select File
                </label>
            </div>
            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          </div>
        )}
    </div>
  );
};

export default FileUpload;