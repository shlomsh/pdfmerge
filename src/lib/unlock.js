import { PDFDocument } from '@cantoo/pdf-lib';

export class WrongPasswordError extends Error {
  constructor() {
    super('Incorrect password for this PDF.');
    this.name = 'WrongPasswordError';
  }
}

// Decrypts a password-protected PDF and returns an unencrypted copy as a Blob.
// Runs entirely in-memory in the browser — the password never leaves the device.
export async function unlockPdf(file, password) {
  const bytes = await file.arrayBuffer();

  let pdfDoc;
  try {
    pdfDoc = await PDFDocument.load(bytes, { password });
  } catch (err) {
    throw new WrongPasswordError();
  }

  const unlockedBytes = await pdfDoc.save();
  return new Blob([unlockedBytes], { type: 'application/pdf' });
}
