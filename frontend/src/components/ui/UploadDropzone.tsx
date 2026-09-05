import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface UploadDropzoneProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading?: boolean;
  accept?: string;
  maxFiles?: number;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onUpload,
  isUploading = false,
  accept = '.pdf,.docx,.txt',
  maxFiles = 50,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedExtensions = ['.pdf', '.docx', '.txt'];

  const validateFiles = (files: FileList | File[]): File[] => {
    const valid: File[] = [];
    let hasInvalid = false;

    Array.from(files).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (allowedExtensions.includes(ext)) {
        if (file.size <= 10 * 1024 * 1024) {
          valid.push(file);
        } else {
          setError(`File ${file.name} exceeds the 10MB limit`);
          hasInvalid = true;
        }
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid && !error) {
      setError('Some files were skipped. Only PDF, DOCX, and TXT files are accepted.');
    }
    return valid.slice(0, maxFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    if (e.dataTransfer.files) {
      const valid = validateFiles(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const valid = validateFiles(e.target.files);
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Drop Target */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.01]'
            : 'border-emerald-500/20 hover:border-emerald-500/40 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <UploadCloud className="w-8 h-8 animate-bounce" />
          </div>

          <div>
            <h4 className="text-base font-semibold text-slate-100 font-heading">
              Drag & drop resumes here, or <span className="text-emerald-400 underline">browse files</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="text-slate-300 font-medium">PDF, DOCX, TXT</span> (up to 10MB each, batch up to 50 resumes)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border border-emerald-500/15 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">
              Ready for AI Screening ({selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'})
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="emerald"
              onClick={handleSubmit}
              isLoading={isUploading}
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              {isUploading ? 'Screening Resumes...' : `Screen ${selectedFiles.length} Resumes with AI`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
