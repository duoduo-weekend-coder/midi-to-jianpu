import React from 'react';
import type { JianpuNote, JianpuChord, JianpuElement } from '../../types/jianpu';
import { SVG } from '../../core/constants';

interface NoteSvgProps {
  element: JianpuElement;
  /** Center x of the note slot */
  x: number;
  /** Baseline y of the digit */
  y: number;
  /** Number of beam underlines beneath this element (0-3) */
  beamLevel: number;
}

/**
 * Render octave dots above or below a note digit, centered on the digit.
 *
 * Lower dots are placed just below the actual beam underlines for this
 * particular note, so notes with 0 beams have dots tight against the digit
 * while notes with 2-3 beams have dots pushed below.
 */
function renderOctaveDots(
  cx: number,
  baselineY: number,
  octave: number,
  beamLevel: number
): React.ReactElement[] {
  const dots: React.ReactElement[] = [];
  const r = SVG.OCTAVE_DOT_RADIUS;

  if (octave > 0) {
    for (let i = 0; i < octave; i++) {
      dots.push(
        <circle
          key={`od-a-${i}`}
          cx={cx}
          cy={baselineY - SVG.NOTE_FONT_SIZE - 2 - i * SVG.OCTAVE_DOT_GAP}
          r={r}
          fill="currentColor"
        />
      );
    }
  } else if (octave < 0) {
    // Start just below the last beam line (or just below the digit if no beams)
    const beamBottom =
      beamLevel > 0
        ? SVG.BEAM_OFFSET + (beamLevel - 1) * SVG.BEAM_GAP + 3
        : 4;
    const startY = baselineY + beamBottom;
    const abs = -octave;
    for (let i = 0; i < abs; i++) {
      dots.push(
        <circle
          key={`od-b-${i}`}
          cx={cx}
          cy={startY + i * SVG.OCTAVE_DOT_GAP}
          r={r}
          fill="currentColor"
        />
      );
    }
  }

  return dots;
}

/**
 * Render accidental as a small superscript to the left of the digit.
 */
function renderAccidental(
  cx: number,
  baselineY: number,
  accidental: string
): React.ReactElement {
  const symbol =
    accidental === '#' ? '#' :
    accidental === 'b' ? 'b' :
    accidental === '##' ? 'x' : 'bb';

  return (
    <text
      x={cx - SVG.DIGIT_WIDTH * 0.5 - 1}
      y={baselineY - SVG.NOTE_FONT_SIZE * 0.45}
      fontSize={SVG.ACCIDENTAL_FONT_SIZE}
      fontFamily="serif"
      fill="currentColor"
      textAnchor="end"
    >
      {symbol}
    </text>
  );
}

/**
 * Render a single digit with octave dots and accidental.
 */
function renderDigit(
  note: JianpuNote,
  cx: number,
  baselineY: number,
  beamLevel: number
): React.ReactElement {
  return (
    <g>
      {note.accidental && renderAccidental(cx, baselineY, note.accidental)}
      <text
        x={cx}
        y={baselineY}
        fontSize={SVG.NOTE_FONT_SIZE}
        fontFamily="'Times New Roman', 'Noto Serif', serif"
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="alphabetic"
      >
        {note.digit}
      </text>
      {renderOctaveDots(cx, baselineY, note.octave, beamLevel)}
      {note.dotted && (
        <circle
          cx={cx + SVG.DIGIT_WIDTH * 0.5 + SVG.AUG_DOT_OFFSET_X}
          cy={baselineY - SVG.NOTE_FONT_SIZE * 0.35}
          r={SVG.AUG_DOT_RADIUS}
          fill="currentColor"
        />
      )}
    </g>
  );
}

/**
 * Render any JianpuElement: note, chord, rest (0), or sustain dash (-).
 */
const NoteSvg: React.FC<NoteSvgProps> = ({ element, x, y, beamLevel }) => {
  const cx = x;
  const baselineY = y;

  switch (element.type) {
    case 'note':
      return renderDigit(element, cx, baselineY, beamLevel);

    case 'chord': {
      const chord = element as JianpuChord;
      return (
        <g>
          {chord.notes.map((note, i) => (
            <g key={i}>
              {renderDigit(
                note,
                cx,
                baselineY - i * SVG.CHORD_STACK_OFFSET,
                i === 0 ? beamLevel : 0 // only bottom note gets beam-aware dots
              )}
            </g>
          ))}
          {chord.dotted && (
            <circle
              cx={cx + SVG.DIGIT_WIDTH * 0.5 + SVG.AUG_DOT_OFFSET_X}
              cy={baselineY - SVG.NOTE_FONT_SIZE * 0.35}
              r={SVG.AUG_DOT_RADIUS}
              fill="currentColor"
            />
          )}
        </g>
      );
    }

    case 'rest':
      return (
        <g>
          <text
            x={cx}
            y={baselineY}
            fontSize={SVG.NOTE_FONT_SIZE}
            fontFamily="'Times New Roman', 'Noto Serif', serif"
            fill="currentColor"
            textAnchor="middle"
            dominantBaseline="alphabetic"
          >
            0
          </text>
          {element.dotted && (
            <circle
              cx={cx + SVG.DIGIT_WIDTH * 0.5 + SVG.AUG_DOT_OFFSET_X}
              cy={baselineY - SVG.NOTE_FONT_SIZE * 0.35}
              r={SVG.AUG_DOT_RADIUS}
              fill="currentColor"
            />
          )}
        </g>
      );

    case 'sustain':
      return (
        <g>
          <line
            x1={cx - SVG.DIGIT_WIDTH * 0.4}
            y1={baselineY - SVG.NOTE_FONT_SIZE * 0.35}
            x2={cx + SVG.DIGIT_WIDTH * 0.4}
            y2={baselineY - SVG.NOTE_FONT_SIZE * 0.35}
            stroke="currentColor"
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          {element.dotted && (
            <circle
              cx={cx + SVG.DIGIT_WIDTH * 0.5 + SVG.AUG_DOT_OFFSET_X}
              cy={baselineY - SVG.NOTE_FONT_SIZE * 0.35}
              r={SVG.AUG_DOT_RADIUS}
              fill="currentColor"
            />
          )}
        </g>
      );

    default:
      return null;
  }
};

export default NoteSvg;
