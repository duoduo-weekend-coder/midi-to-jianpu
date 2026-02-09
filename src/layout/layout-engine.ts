import type {
  JianpuScore,
  JianpuMeasure,
  ScoreLayout,
  LayoutPage,
  LayoutSystem,
  LayoutMeasure,
} from '../types/jianpu';
import { SVG } from '../core/constants';

/**
 * Calculate the minimum width needed for a measure based on beat groups.
 */
function measureMinWidth(measure: JianpuMeasure): number {
  let totalWidth = SVG.MEASURE_PAD * 2;

  for (let i = 0; i < measure.beatGroups.length; i++) {
    const bg = measure.beatGroups[i];
    const n = bg.elements.length;
    if (bg.beamLevel > 0) {
      totalWidth += n * SVG.BEAM_GROUP_SPACING;
    } else {
      totalWidth += n * SVG.BEAT_SPACING;
    }
    if (i < measure.beatGroups.length - 1) {
      totalWidth += SVG.BEAT_GROUP_GAP;
    }
  }

  return Math.max(totalWidth, 30);
}

/**
 * Greedy line-breaking: fit as many measures as possible per system line,
 * then stretch to fill.
 */
function breakIntoSystems(
  measures: JianpuMeasure[],
  availableWidth: number
): LayoutSystem[] {
  const systems: LayoutSystem[] = [];
  let currentLine: LayoutMeasure[] = [];
  let currentWidth = 0;

  for (let i = 0; i < measures.length; i++) {
    const minW = measureMinWidth(measures[i]);

    if (currentLine.length > 0 && currentWidth + minW > availableWidth) {
      systems.push(stretchSystem(currentLine, availableWidth));
      currentLine = [];
      currentWidth = 0;
    }

    currentLine.push({ measureIndex: i, width: minW });
    currentWidth += minW;
  }

  if (currentLine.length > 0) {
    // Don't stretch the last line if it's quite short
    if (currentWidth < availableWidth * 0.55) {
      systems.push({
        measures: currentLine,
        y: 0,
        totalWidth: currentWidth,
      });
    } else {
      systems.push(stretchSystem(currentLine, availableWidth));
    }
  }

  return systems;
}

/**
 * Stretch measures proportionally to fill the available width.
 */
function stretchSystem(
  measures: LayoutMeasure[],
  targetWidth: number
): LayoutSystem {
  const totalMinWidth = measures.reduce((sum, m) => sum + m.width, 0);
  const scale = targetWidth / totalMinWidth;

  return {
    measures: measures.map((m) => ({
      measureIndex: m.measureIndex,
      width: m.width * scale,
    })),
    y: 0,
    totalWidth: targetWidth,
  };
}

/**
 * Break systems into pages.
 */
function breakIntoPages(
  systems: LayoutSystem[],
  voiceCount: number,
  hasHeader: boolean
): LayoutPage[] {
  const pages: LayoutPage[] = [];
  const pageContent = SVG.PAGE_HEIGHT - SVG.MARGIN_TOP - SVG.MARGIN_BOTTOM;
  const systemHeight = SVG.VOICE_HEIGHT * voiceCount + SVG.SYSTEM_GAP;

  let pageSystems: LayoutSystem[] = [];
  let y = hasHeader ? SVG.HEADER_HEIGHT : 0;
  let pageNum = 1;

  for (const sys of systems) {
    if (y + systemHeight > pageContent && pageSystems.length > 0) {
      pages.push({ pageNumber: pageNum, systems: pageSystems });
      pageSystems = [];
      y = 0;
      pageNum++;
    }
    sys.y = y;
    pageSystems.push(sys);
    y += systemHeight;
  }

  if (pageSystems.length > 0) {
    pages.push({ pageNumber: pageNum, systems: pageSystems });
  }

  return pages;
}

/**
 * Compute full layout for a score.
 */
export function computeLayout(score: JianpuScore): ScoreLayout {
  const available = SVG.PAGE_WIDTH - SVG.MARGIN_LEFT - SVG.MARGIN_RIGHT;
  const visible = score.voices.filter((v) => v.visible);

  if (visible.length === 0) {
    return {
      pages: [{ pageNumber: 1, systems: [] }],
      pageWidth: SVG.PAGE_WIDTH,
      pageHeight: SVG.PAGE_HEIGHT,
      marginTop: SVG.MARGIN_TOP,
      marginBottom: SVG.MARGIN_BOTTOM,
      marginLeft: SVG.MARGIN_LEFT,
      marginRight: SVG.MARGIN_RIGHT,
    };
  }

  const measures = visible[0].measures;
  const systems = breakIntoSystems(measures, available);
  const pages = breakIntoPages(systems, visible.length, true);

  return {
    pages,
    pageWidth: SVG.PAGE_WIDTH,
    pageHeight: SVG.PAGE_HEIGHT,
    marginTop: SVG.MARGIN_TOP,
    marginBottom: SVG.MARGIN_BOTTOM,
    marginLeft: SVG.MARGIN_LEFT,
    marginRight: SVG.MARGIN_RIGHT,
  };
}
