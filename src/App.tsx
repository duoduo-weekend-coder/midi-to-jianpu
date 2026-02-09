import { useState, useCallback } from 'react';
import FileUploader from './components/FileUploader';
import TrackSelector from './components/TrackSelector';
import ScoreView from './components/ScoreView';
import Toolbar from './components/Toolbar';
import { useMidiFile } from './hooks/useMidiFile';
import { useJianpuScore } from './hooks/useJianpuScore';

function App() {
  const { parsedMidi, error, loading, loadFile, reset } = useMidiFile();
  const [trackVisibility, setTrackVisibility] = useState<Record<number, boolean>>({});
  const [zoom, setZoom] = useState(1);

  const { score, layout } = useJianpuScore(parsedMidi, trackVisibility);

  const handleToggleTrack = useCallback((trackIndex: number) => {
    setTrackVisibility((prev) => ({
      ...prev,
      [trackIndex]: prev[trackIndex] === false ? true : false,
    }));
  }, []);

  const handleReset = useCallback(() => {
    reset();
    setTrackVisibility({});
    setZoom(1);
  }, [reset]);

  // Landing / upload view
  if (!parsedMidi) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
            MIDI to Jianpu
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Convert MIDI files to numbered musical notation (简谱)
          </p>

          <FileUploader onFileLoaded={loadFile} loading={loading} />

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 text-center text-xs text-gray-400">
            <p>Key is always 1=C (no transposition)</p>
            <p>Supports multi-track MIDI files with full polyphony</p>
          </div>
        </div>
      </div>
    );
  }

  // Score view
  if (!score || !layout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Converting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toolbar
        score={score}
        zoom={zoom}
        onZoomChange={setZoom}
        onReset={handleReset}
      />

      {score.voices.length > 1 && (
        <div className="px-4 py-2 border-b border-gray-200 bg-white">
          <TrackSelector
            voices={score.voices}
            trackVisibility={trackVisibility}
            onToggleTrack={handleToggleTrack}
          />
        </div>
      )}

      <ScoreView score={score} layout={layout} zoom={zoom} />
    </div>
  );
}

export default App;
