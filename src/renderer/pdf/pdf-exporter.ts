import { jsPDF } from 'jspdf';

/**
 * Render an SVG element to a high-resolution canvas using the browser's
 * native SVG rendering, which correctly handles all fonts including CJK.
 */
function svgToCanvas(
  svgEl: SVGSVGElement,
  width: number,
  height: number,
  scale: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to image'));
    };
    img.src = url;
  });
}

/**
 * Export all SVG page elements to a single PDF file.
 * Renders via canvas to preserve Chinese characters and all fonts.
 */
export async function exportToPdf(
  title: string
): Promise<void> {
  const svgElements = document.querySelectorAll<SVGSVGElement>('.jianpu-page');

  if (svgElements.length === 0) {
    throw new Error('No score pages found to export');
  }

  const firstSvg = svgElements[0];
  const viewBox = firstSvg.viewBox.baseVal;
  const pageWidth = viewBox.width || 595;
  const pageHeight = viewBox.height || 842;

  // 3x scale -> ~216 DPI for A4, sharp enough for print
  const scale = 3;

  const pdf = new jsPDF({
    orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pageWidth, pageHeight],
  });

  for (let i = 0; i < svgElements.length; i++) {
    if (i > 0) {
      pdf.addPage([pageWidth, pageHeight]);
    }

    try {
      const canvas = await svgToCanvas(svgElements[i], pageWidth, pageHeight, scale);
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
    } catch (err) {
      console.error(`Error rendering page ${i + 1} to PDF:`, err);
    }
  }

  const fileName = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff\s]/g, '').trim() || 'jianpu'}.pdf`;
  pdf.save(fileName);
}
