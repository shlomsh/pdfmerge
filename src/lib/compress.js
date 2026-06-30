import { PDFDocument } from '@cantoo/pdf-lib';

let pdfjsLib;

async function getPdfjs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).href;
  }
  return pdfjsLib;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      type,
      quality,
    );
  });
}

/**
 * Compresses a PDF file 100% client-side by rasterizing its pages.
 * 
 * @param {File} file - The original PDF file.
 * @param {Object} options
 * @param {string} [options.level='medium'] - 'low' | 'medium' | 'high'
 * @param {Function} [options.onProgress] - Callback for progress (0 to 1).
 * @returns {Promise<Blob>} The compressed PDF Blob.
 */
export async function compressPdf(file, { level = 'medium', onProgress } = {}) {
  // Determine scale (DPI) and image quality based on compression level
  // Low compression -> high quality/DPI
  // High compression -> low quality/DPI
  let scale = 1.5; // ~110 DPI
  let quality = 0.6;

  if (level === 'high') {
    scale = 1.0; // ~72 DPI
    quality = 0.4;
  } else if (level === 'low') {
    scale = 2.0; // ~144 DPI
    quality = 0.8;
  }

  const lib = await getPdfjs();
  const bytes = await file.arrayBuffer();
  const loadingTask = lib.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  const pdfDoc = await PDFDocument.create();

  try {
    const totalPages = pdf.numPages;

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      
      // Viewport for rendering to canvas at selected scale
      const viewport = page.getViewport({ scale });
      
      // Viewport at scale 1 to set the new PDF page size in points (1 point = 1/72 inch)
      const nativeViewport = page.getViewport({ scale: 1 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');

      // JPEG has no transparency - fill white first to prevent black background
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      await page.render({ canvasContext: context, viewport }).promise;
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      const imgBytes = await blob.arrayBuffer();

      const img = await pdfDoc.embedJpg(imgBytes);
      const newPage = pdfDoc.addPage([nativeViewport.width, nativeViewport.height]);
      
      newPage.drawImage(img, {
        x: 0,
        y: 0,
        width: nativeViewport.width,
        height: nativeViewport.height,
      });

      onProgress?.(pageNumber / totalPages);
    }

    const compressedBytes = await pdfDoc.save();
    return new Blob([compressedBytes], { type: 'application/pdf' });
  } finally {
    await loadingTask.destroy();
  }
}
