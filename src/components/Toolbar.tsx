import React, { useState } from 'react';
import type { JianpuScore } from '../types/jianpu';
import { exportToPdf } from '../renderer/pdf/pdf-exporter';

interface ToolbarProps {
  score: JianpuScore;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const Toolbar: React.FC<ToolbarProps> = ({
  score,
  zoom,
  onZoomChange,
  onReset,
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportToPdf(score.title);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Check console for details.');
    } finally {
      setExporting(false);
    }
  };

  const handleZoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[idx + 1]);
    }
  };

  const handleZoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom);
    if (idx > 0) {
      onZoomChange(ZOOM_LEVELS[idx - 1]);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-800 truncate max-w-xs">
          {score.title}
        </h2>
        <span className="text-sm text-gray-500">
          {score.measureCount} measures
          {score.voices.length > 1 ? ` / ${score.voices.filter(v => v.visible).length} tracks` : ''}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
          title="Zoom out"
        >
          -
        </button>
        <span className="text-sm text-gray-600 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
          title="Zoom in"
        >
          +
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Export PDF */}
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
        >
          New File
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
