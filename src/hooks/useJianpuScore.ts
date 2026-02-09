import { useMemo } from 'react';
import type { ParsedMidi, JianpuScore, ScoreLayout } from '../types/jianpu';
import { quantizeMidi } from '../core/duration-quantizer';
import { buildScore } from '../core/measure-builder';
import { computeLayout } from '../layout/layout-engine';

interface UseJianpuScoreReturn {
  score: JianpuScore | null;
  layout: ScoreLayout | null;
}

export function useJianpuScore(
  parsedMidi: ParsedMidi | null,
  trackVisibility: Record<number, boolean>
): UseJianpuScoreReturn {
  const score = useMemo(() => {
    if (!parsedMidi) return null;

    try {
      const quantized = quantizeMidi(parsedMidi);
      const builtScore = buildScore(quantized);

      // Apply track visibility
      builtScore.voices = builtScore.voices.map((voice) => ({
        ...voice,
        visible: trackVisibility[voice.trackIndex] !== false,
      }));

      return builtScore;
    } catch (err) {
      console.error('Error converting MIDI to Jianpu:', err);
      return null;
    }
  }, [parsedMidi, trackVisibility]);

  const layout = useMemo(() => {
    if (!score) return null;
    return computeLayout(score);
  }, [score]);

  return { score, layout };
}
