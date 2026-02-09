import React from 'react';
import type { JianpuMeasure, BeatGroup } from '../../types/jianpu';
import { SVG } from '../../core/constants';
import NoteSvg from './NoteSvg';
import DurationBeams from './DurationBeams';

interface MeasureSvgProps {
  measure: JianpuMeasure;
  x: number;
  /** Baseline y for the digit row */
  baselineY: number;
  width: number;
  /** Height of the bar line (spans all voices) */
  barLineHeight: number;
  /** Y of bar line top */
  barLineTop: number;
  isFirst: boolean;
  isLast: boolean;
  /** Show measure number above first beat? */
  showMeasureNumber: boolean;
}

/**
 * Calculate the "natural" (minimum) width for a beat group.
 */
function beatGroupNaturalWidth(bg: BeatGroup): number {
  const n = bg.elements.length;
  if (n === 0) return 0;
  if (bg.beamLevel > 0) {
    // Beamed: tight spacing
    return n * SVG.BEAM_GROUP_SPACING;
  }
  // Un-beamed (quarter+): wider spacing
  return n * SVG.BEAT_SPACING;
}

/**
 * Render a single measure: its beat groups with notes and beams.
 * Bar lines are drawn by the parent (JianpuSvgRenderer) so they can span voices.
 */
const MeasureSvg: React.FC<MeasureSvgProps> = ({
  measure,
  x,
  baselineY,
  width,
  barLineHeight,
  barLineTop,
  isFirst,
  isLast,
  showMeasureNumber,
}) => {
  const parts: React.ReactElement[] = [];

  // --- Bar lines ---
  // Left bar line only on first measure of system
  if (isFirst) {
    parts.push(
      <line
        key="bl"
        x1={x}
        y1={barLineTop}
        x2={x}
        y2={barLineTop + barLineHeight}
        stroke="currentColor"
        strokeWidth={0.8}
      />
    );
  }

  // Right bar line
  if (isLast) {
    // Double final bar line
    parts.push(
      <line
        key="br-thin"
        x1={x + width - 3.5}
        y1={barLineTop}
        x2={x + width - 3.5}
        y2={barLineTop + barLineHeight}
        stroke="currentColor"
        strokeWidth={0.8}
      />
    );
    parts.push(
      <line
        key="br-thick"
        x1={x + width}
        y1={barLineTop}
        x2={x + width}
        y2={barLineTop + barLineHeight}
        stroke="currentColor"
        strokeWidth={2}
      />
    );
  } else {
    parts.push(
      <line
        key="br"
        x1={x + width}
        y1={barLineTop}
        x2={x + width}
        y2={barLineTop + barLineHeight}
        stroke="currentColor"
        strokeWidth={0.8}
      />
    );
  }

  // --- Measure number ---
  if (showMeasureNumber) {
    parts.push(
      <text
        key="mnum"
        x={x + SVG.MEASURE_PAD}
        y={barLineTop - 12}
        fontSize={SVG.MEASURE_NUM_FONT_SIZE}
        fontFamily="sans-serif"
        fill="#888"
      >
        ({measure.measureNumber})
      </text>
    );
  }

  // --- Beat groups layout ---
  // First compute natural widths, then scale to fill the measure.
  const groups = measure.beatGroups;
  if (groups.length === 0) return <g>{parts}</g>;

  const naturalWidths = groups.map(beatGroupNaturalWidth);
  const totalNatural =
    naturalWidths.reduce((s, w) => s + w, 0) +
    (groups.length - 1) * SVG.BEAT_GROUP_GAP;

  const contentWidth = width - SVG.MEASURE_PAD * 2;
  const scale = contentWidth / Math.max(totalNatural, 1);

  let groupX = x + SVG.MEASURE_PAD;

  groups.forEach((bg, gIdx) => {
    const gw = naturalWidths[gIdx] * scale;
    const n = bg.elements.length;
    if (n === 0) {
      groupX += gw + SVG.BEAT_GROUP_GAP * scale;
      return;
    }

    // Distribute elements within the group
    const spacing = gw / n;
    const positions: number[] = [];

    bg.elements.forEach((el, eIdx) => {
      const cx = groupX + spacing * (eIdx + 0.5);
      positions.push(cx);

      parts.push(
        <NoteSvg
          key={`g${gIdx}e${eIdx}`}
          element={el}
          x={cx}
          y={baselineY}
          beamLevel={bg.beamLevel}
        />
      );
    });

    // Beams
    if (bg.beamLevel > 0) {
      parts.push(
        <DurationBeams
          key={`bm${gIdx}`}
          beatGroup={bg}
          elementXPositions={positions}
          baselineY={baselineY}
        />
      );
    }

    groupX += gw + SVG.BEAT_GROUP_GAP * scale;
  });

  return <g className="measure">{parts}</g>;
};

export default MeasureSvg;
