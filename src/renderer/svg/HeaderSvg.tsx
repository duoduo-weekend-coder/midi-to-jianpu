import React from 'react';
import type { JianpuScore } from '../../types/jianpu';
import { SVG } from '../../core/constants';

interface HeaderSvgProps {
  score: JianpuScore;
  pageWidth: number;
  /** Y position where the first system starts (to place time sig inline) */
  firstSystemY: number;
  /** Number of visible voices (for time sig vertical centering) */
  voiceCount: number;
}

/**
 * Render the score header: title, 1=C, key info, tempo, and stacked time signature.
 */
const HeaderSvg: React.FC<HeaderSvgProps> = ({
  score,
  pageWidth,
  firstSystemY,
  voiceCount,
}) => {
  const centerX = pageWidth / 2;
  const tsFontSize = SVG.TIME_SIG_FONT_SIZE;

  // Key description
  const keyDesc =
    score.keySignature.root !== 'C' || score.keySignature.mode !== 'major'
      ? `(${score.keySignature.root} ${score.keySignature.mode})`
      : '';

  // Time signature: rendered as stacked numerator / denominator
  // Placed to the left of the first measure, vertically centred on the system
  const systemHeight = voiceCount * SVG.VOICE_HEIGHT;
  const tsCenterY = firstSystemY + systemHeight / 2;

  return (
    <g className="header">
      {/* Title */}
      <text
        x={centerX}
        y={26}
        fontSize={20}
        fontFamily="'SimSun', 'Songti SC', 'Noto Serif CJK SC', serif"
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
      >
        {score.title}
      </text>

      {/* 1=C and key info */}
      <text
        x={SVG.MARGIN_LEFT}
        y={52}
        fontSize={12}
        fontFamily="serif"
        fill="currentColor"
      >
        {'1=C'}{keyDesc ? '  ' + keyDesc : ''}
      </text>

      {/* Tempo marking */}
      <text
        x={pageWidth - SVG.MARGIN_RIGHT}
        y={52}
        fontSize={12}
        fontFamily="serif"
        fill="currentColor"
        textAnchor="end"
      >
        {`♩＝${score.tempo}`}
      </text>

      {/* Stacked time signature: numerator above denominator */}
      <text
        x={SVG.MARGIN_LEFT - SVG.BRACE_WIDTH - 14}
        y={tsCenterY - 2}
        fontSize={tsFontSize}
        fontFamily="'Times New Roman', serif"
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="alphabetic"
      >
        {score.timeSignature.numerator}
      </text>
      <text
        x={SVG.MARGIN_LEFT - SVG.BRACE_WIDTH - 14}
        y={tsCenterY + tsFontSize - 2}
        fontSize={tsFontSize}
        fontFamily="'Times New Roman', serif"
        fontWeight="bold"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="alphabetic"
      >
        {score.timeSignature.denominator}
      </text>
    </g>
  );
};

export default HeaderSvg;
