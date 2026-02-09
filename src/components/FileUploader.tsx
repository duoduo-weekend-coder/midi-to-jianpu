import React, { useCallback, useRef, useState } from 'react';

interface FileUploaderProps {
  onFileLoaded: (file: File) => void;
  loading: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileLoaded, loading }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (file.name.match(/\.midi?$/i)) {
        onFileLoaded(file);
      } else {
        alert('Please upload a .mid or .midi file.');
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-colors duration-200
        ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'}
        ${loading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mid,.midi"
        className="hidden"
        onChange={handleChange}
      />

      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>

        <div>
          <p className="text-lg font-medium text-gray-700">
            {loading ? 'Parsing MIDI file...' : 'Drop a MIDI file here'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse (.mid, .midi)
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
