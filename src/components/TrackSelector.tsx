import React from 'react';
import type { JianpuVoice } from '../types/jianpu';

interface TrackSelectorProps {
  voices: JianpuVoice[];
  trackVisibility: Record<number, boolean>;
  onToggleTrack: (trackIndex: number) => void;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({
  voices,
  trackVisibility,
  onToggleTrack,
}) => {
  if (voices.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
      <span className="text-sm font-medium text-gray-600">Tracks:</span>
      {voices.map((voice) => {
        const isVisible = trackVisibility[voice.trackIndex] !== false;
        return (
          <label
            key={voice.trackIndex}
            className="flex items-center gap-1.5 text-sm cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={isVisible}
              onChange={() => onToggleTrack(voice.trackIndex)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className={isVisible ? 'text-gray-800' : 'text-gray-400'}>
              {voice.name}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default TrackSelector;
