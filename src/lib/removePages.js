import { PDFDocument } from '@cantoo/pdf-lib';

/**
 * Removes pages from a PDF.
 * @param {File} file The original PDF file.
 * @param {number[]} pageIndicesToRemove 0-indexed page numbers to remove.
 * @param {function} onProgress Progress callback.
 * @returns {Promise<Blob>} The modified PDF Blob.
 */
export async function removePages(file, pageIndicesToRemove, onProgress) {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  
  // Sort indices in descending order so removal doesn't shift the indices of pages we want to remove later.
  const sortedIndices = [...pageIndicesToRemove].sort((a, b) => b - a);
  const total = sortedIndices.length;
  
  for (let i = 0; i < total; i++) {
    pdfDoc.removePage(sortedIndices[i]);
    onProgress?.((i + 1) / total);
  }
  
  const modifiedBytes = await pdfDoc.save();
  return new Blob([modifiedBytes], { type: 'application/pdf' });
}
