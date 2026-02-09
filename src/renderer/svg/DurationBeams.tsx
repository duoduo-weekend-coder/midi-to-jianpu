import React from 'react';
import type { BeatGroup, JianpuElement } from '../../types/jianpu';
import { SVG } from '../../core/constants';

interface DurationBeamsProps {
  beatGroup: BeatGroup;
  /** Center-x positions of each element in the beat group */
  elementXPositions: number[];
  /** Baseline y of the digits */
  baselineY: number;
}

/**
 * Get the beam level for an individual element.
 */
function getElementBeamLevel(element: JianpuElement): number {
  const dur = element.duration;
  if (dur >= 0.25 - 0.001) return 0;
  if (dur >= 0.125 - 0.001) return 1;
  if (dur >= 0.0625 - 0.001) return 2;
  return 3;
}

/**
 * Render beam underlines beneath a beat group.
 *
 * Beams span from the left edge of the first note to the right edge of the
 * last note in each contiguous run that needs that beam level.
 */
const DurationBeams: React.FC<DurationBeamsProps> = ({
  beatGroup,
  elementXPositions,
  baselineY,
}) => {
  if (beatGroup.beamLevel === 0 || elementXPositions.length === 0) {
    return null;
  }

  // First beam line sits just below the digit bottom
  const firstBeamY = baselineY + SVG.BEAM_OFFSET;
  const halfW = SVG.DIGIT_WIDTH * 0.55; // half-width of underline per note
  const lines: React.ReactElement[] = [];

  for (let level = 1; level <= beatGroup.beamLevel; level++) {
    let runStart = -1;

    for (let i = 0; i <= beatGroup.elements.length; i++) {
      const needs =
        i < beatGroup.elements.length &&
        getElementBeamLevel(beatGroup.elements[i]) >= level;

      if (needs && runStart === -1) {
        runStart = i;
      } else if (!needs && runStart !== -1) {
        const x1 = elementXPositions[runStart] - halfW;
        const x2 = elementXPositions[i - 1] + halfW;
        const ly = firstBeamY + (level - 1) * SVG.BEAM_GAP;

        lines.push(
          <line
            key={`b${level}-${runStart}`}
            x1={x1}
            y1={ly}
            x2={x2}
            y2={ly}
            stroke="currentColor"
            strokeWidth={SVG.BEAM_THICKNESS}
          />
        );
        runStart = -1;
      }
    }
  }

  return <g className="beams">{lines}</g>;
};

export default DurationBeams;
