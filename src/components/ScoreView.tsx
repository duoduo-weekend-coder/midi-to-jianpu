import React from 'react';
import type { JianpuScore, ScoreLayout } from '../types/jianpu';
import JianpuSvgRenderer from '../renderer/svg/JianpuSvgRenderer';

interface ScoreViewProps {
  score: JianpuScore;
  layout: ScoreLayout;
  zoom: number;
}

const ScoreView: React.FC<ScoreViewProps> = ({ score, layout, zoom }) => {
  return (
    <div className="flex-1 overflow-auto bg-gray-200 p-8">
      <JianpuSvgRenderer score={score} layout={layout} zoom={zoom} />
    </div>
  );
};

export default ScoreView;
