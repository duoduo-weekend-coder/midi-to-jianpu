import React from 'react';
import type { JianpuScore, ScoreLayout } from '../../types/jianpu';
import { SVG } from '../../core/constants';
import HeaderSvg from './HeaderSvg';
import MeasureSvg from './MeasureSvg';

interface JianpuSvgRendererProps {
  score: JianpuScore;
  layout: ScoreLayout;
  zoom: number;
}

/**
 * Draw a curly brace connecting multiple voices on the left side.
 * Uses a simple cubic bezier path.
 */
function renderBrace(
  x: number,
  top: number,
  bottom: number
): React.ReactElement {
  const midY = (top + bottom) / 2;
  const w = SVG.BRACE_WIDTH;
  // Cubic bezier: curves out at top and bottom, meets at center point
  const d = [
    `M ${x},${top}`,
    `C ${x - w * 0.4},${top + (midY - top) * 0.3} ${x - w},${midY - 6} ${x - w},${midY}`,
    `C ${x - w},${midY + 6} ${x - w * 0.4},${bottom - (bottom - midY) * 0.3} ${x},${bottom}`,
  ].join(' ');

  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
    />
  );
}

/**
 * Top-level SVG renderer that assembles pages with systems of measures.
 * Handles multi-voice braces, bar lines that span voices, and measure numbers.
 */
const JianpuSvgRenderer: React.FC<JianpuSvgRendererProps> = ({
  score,
  layout,
  zoom,
}) => {
  const visibleVoices = score.voices.filter((v) => v.visible);
  const voiceCount = visibleVoices.length;

  return (
    <div className="jianpu-pages flex flex-col items-center gap-8">
      {layout.pages.map((page) => (
        <svg
          key={page.pageNumber}
          className="jianpu-page bg-white shadow-lg"
          data-page={page.pageNumber}
          width={layout.pageWidth * zoom}
          height={layout.pageHeight * zoom}
          viewBox={`0 0 ${layout.pageWidth} ${layout.pageHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: '#000' }}
        >
          <rect width={layout.pageWidth} height={layout.pageHeight} fill="white" />

          {/* Header on first page */}
          {page.pageNumber === 1 && page.systems.length > 0 && (
            <HeaderSvg
              score={score}
              pageWidth={layout.pageWidth}
              firstSystemY={layout.marginTop + page.systems[0].y + SVG.SPACE_ABOVE}
              voiceCount={voiceCount}
            />
          )}

          {/* Systems */}
          {page.systems.map((system, sysIdx) => {
            // Each voice gets VOICE_HEIGHT vertical space.
            // Within that, baseline is at SPACE_ABOVE from the top.
            const systemTopY = layout.marginTop + system.y;

            // Bar line span: from top of first voice to bottom of last voice
            const barLineTop = systemTopY;
            const barLineBottom = systemTopY + voiceCount * SVG.VOICE_HEIGHT;
            const barLineHeight = barLineBottom - barLineTop;

            return (
              <g key={`sys-${sysIdx}`} className="system">
                {/* Curly brace for multi-voice */}
                {voiceCount > 1 && (
                  <g className="brace">
                    {renderBrace(
                      layout.marginLeft - 2,
                      barLineTop + 2,
                      barLineBottom - 2
                    )}
                  </g>
                )}

                {/* Measures in this system */}
                {(() => {
                  let measX = layout.marginLeft;
                  return system.measures.map((layoutMeasure, mIdx) => {
                    const mx = measX;
                    measX += layoutMeasure.width;

                    const isFirst = mIdx === 0;
                    const isLast =
                      page.pageNumber === layout.pages.length &&
                      sysIdx === page.systems.length - 1 &&
                      mIdx === system.measures.length - 1;

                    // Show measure number on first measure of each system
                    const showNum = mIdx === 0;

                    return (
                      <g key={`m-${mIdx}`}>
                        {visibleVoices.map((voice, vIdx) => {
                          const measure = voice.measures[layoutMeasure.measureIndex];
                          if (!measure) return null;

                          const voiceTopY = systemTopY + vIdx * SVG.VOICE_HEIGHT;
                          const baselineY = voiceTopY + SVG.SPACE_ABOVE;

                          return (
                            <MeasureSvg
                              key={`v${vIdx}m${mIdx}`}
                              measure={measure}
                              x={mx}
                              baselineY={baselineY}
                              width={layoutMeasure.width}
                              barLineHeight={barLineHeight}
                              barLineTop={barLineTop}
                              isFirst={isFirst}
                              isLast={isLast}
                              showMeasureNumber={showNum && vIdx === 0}
                            />
                          );
                        })}
                      </g>
                    );
                  });
                })()}
              </g>
            );
          })}

          {/* Page number */}
          {layout.pages.length > 1 && (
            <text
              x={layout.pageWidth / 2}
              y={layout.pageHeight - 18}
              fontSize={10}
              fontFamily="sans-serif"
              fill="#999"
              textAnchor="middle"
            >
              - {page.pageNumber} -
            </text>
          )}
        </svg>
      ))}
    </div>
  );
};

export default JianpuSvgRenderer;
