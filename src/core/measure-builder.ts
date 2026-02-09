import type {
  JianpuElement,
  JianpuMeasure,
  JianpuVoice,
  JianpuScore,
  BeatGroup,
  TimeSignature,
} from '../types/jianpu';
import type { QuantizedMidi } from './duration-quantizer';
import { convertTrackToElements, parseKeySignature } from './jianpu-converter';

/**
 * Get the beam level for a duration.
 * 0 = quarter or longer, 1 = eighth, 2 = sixteenth, 3 = 32nd
 */
function getBeamLevel(duration: number): number {
  if (duration >= 0.25 - 0.001) return 0;      // quarter or longer
  if (duration >= 0.125 - 0.001) return 1;      // eighth
  if (duration >= 0.0625 - 0.001) return 2;     // sixteenth
  return 3;                                       // 32nd
}

/**
 * Split elements at measure boundaries and handle ties.
 */
function splitAtMeasureBoundaries(
  timeline: Array<{ pos: number; element: JianpuElement }>,
  measureDuration: number,
  totalMeasures: number
): JianpuElement[][] {
  const measures: JianpuElement[][] = Array.from({ length: totalMeasures }, () => []);

  for (const { pos, element } of timeline) {
    const measureIdx = Math.floor(pos / measureDuration + 0.0001);
    if (measureIdx >= 0 && measureIdx < totalMeasures) {
      measures[measureIdx].push(element);
    }
  }

  return measures;
}

/**
 * Group elements within a measure into beat groups based on beat boundaries.
 */
function groupIntoBeatGroups(
  elements: JianpuElement[],
  timeSig: TimeSignature
): BeatGroup[] {
  if (elements.length === 0) {
    return [];
  }

  // For simple grouping: each beat boundary creates a new group
  // A beat = 1/denominator of a whole note
  const beatDuration = 1 / timeSig.denominator;

  const beatGroups: BeatGroup[] = [];
  let currentGroup: JianpuElement[] = [];
  let currentBeatPos = 0;
  let maxBeamLevel = 0;

  for (const element of elements) {
    const beamLevel = getBeamLevel(element.duration);

    // For quarter notes and longer, each gets its own group
    if (beamLevel === 0) {
      if (currentGroup.length > 0) {
        beatGroups.push({ elements: currentGroup, beamLevel: maxBeamLevel });
        currentGroup = [];
        maxBeamLevel = 0;
      }
      beatGroups.push({ elements: [element], beamLevel: 0 });
      currentBeatPos += element.duration;
    } else {
      // Sub-beat notes: group by beat boundaries
      const nextBeatBoundary = (Math.floor(currentBeatPos / beatDuration + 0.001) + 1) * beatDuration;

      if (currentBeatPos >= nextBeatBoundary - 0.001 && currentGroup.length > 0) {
        // We've crossed a beat boundary, finalize group
        beatGroups.push({ elements: currentGroup, beamLevel: maxBeamLevel });
        currentGroup = [];
        maxBeamLevel = 0;
      }

      currentGroup.push(element);
      maxBeamLevel = Math.max(maxBeamLevel, beamLevel);
      currentBeatPos += element.duration;
    }
  }

  // Finalize last group
  if (currentGroup.length > 0) {
    beatGroups.push({ elements: currentGroup, beamLevel: maxBeamLevel });
  }

  return beatGroups;
}

/**
 * Build the complete JianpuScore from quantized MIDI data.
 */
export function buildScore(quantized: QuantizedMidi): JianpuScore {
  const keySig = parseKeySignature(quantized.keySignatures);
  const timeSig = quantized.timeSignatures[0]?.timeSignature ?? { numerator: 4, denominator: 4 };

  // Measure duration in whole notes
  const measureDuration = timeSig.numerator / timeSig.denominator;
  const beatDuration = 1 / timeSig.denominator;

  // Total measures needed
  const totalMeasures = Math.max(1, Math.ceil(quantized.totalDuration / measureDuration + 0.001));

  // Extend total duration to fill last measure
  const totalDuration = totalMeasures * measureDuration;

  const voices: JianpuVoice[] = quantized.tracks.map((track) => {
    // Convert track notes to jianpu elements with timeline positions
    const timeline = convertTrackToElements(track, keySig, totalDuration, beatDuration);

    // Split into measures
    const measureElements = splitAtMeasureBoundaries(timeline, measureDuration, totalMeasures);

    // Build measures with beat groups
    const measures: JianpuMeasure[] = measureElements.map((elements, idx) => {
      // If measure is empty, add a whole rest
      if (elements.length === 0) {
        elements = [{ type: 'rest', duration: measureDuration, dotted: false }];
      }

      const beatGroups = groupIntoBeatGroups(elements, timeSig);

      return {
        beatGroups,
        measureNumber: idx + 1,
        // Set time signature on first measure
        ...(idx === 0 ? { timeSignature: timeSig } : {}),
      };
    });

    return {
      name: track.name,
      trackIndex: track.trackIndex,
      measures,
      visible: true,
    };
  });

  return {
    title: quantized.title,
    keySignature: keySig,
    timeSignature: timeSig,
    tempo: Math.round(quantized.tempo),
    voices,
    measureCount: totalMeasures,
  };
}
