import { describe, expect, it } from 'vitest';
import { PDFDocument } from '@cantoo/pdf-lib';
import { isPdfEncrypted, unlockPdf, protectPdf, WrongPasswordError, SecurityError } from './security.js';

describe('security.js', () => {
  async function createEmptyPdfBlob() {
    const doc = await PDFDocument.create();
    doc.addPage();
    const bytes = await doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  }

  async function createEncryptedPdfBlob(password) {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.encrypt({ userPassword: password, ownerPassword: password });
    const bytes = await doc.save();
    return new Blob([bytes], { type: 'application/pdf' });
  }

  it('detects an unencrypted PDF', async () => {
    const blob = await createEmptyPdfBlob();
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    const isEnc = await isPdfEncrypted(file);
    expect(isEnc).toBe(false);
  });

  it('detects an encrypted PDF', async () => {
    const blob = await createEncryptedPdfBlob('secret');
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    const isEnc = await isPdfEncrypted(file);
    expect(isEnc).toBe(true);
  });

  it('protects an unencrypted PDF', async () => {
    const blob = await createEmptyPdfBlob();
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    
    const protectedBlob = await protectPdf(file, 'newpass');
    expect(protectedBlob).toBeInstanceOf(Blob);

    const protectedFile = new File([protectedBlob], 'protected.pdf', { type: 'application/pdf' });
    const isEnc = await isPdfEncrypted(protectedFile);
    expect(isEnc).toBe(true);
  });

  it('fails to protect an already encrypted PDF', async () => {
    const blob = await createEncryptedPdfBlob('secret');
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    
    await expect(protectPdf(file, 'newpass')).rejects.toThrow(SecurityError);
  });

  it('unlocks an encrypted PDF with correct password', async () => {
    const blob = await createEncryptedPdfBlob('secret');
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    
    const unlockedBlob = await unlockPdf(file, 'secret');
    expect(unlockedBlob).toBeInstanceOf(Blob);

    const unlockedFile = new File([unlockedBlob], 'unlocked.pdf', { type: 'application/pdf' });
    const isEnc = await isPdfEncrypted(unlockedFile);
    expect(isEnc).toBe(false);
  });

  it('fails to unlock an encrypted PDF with wrong password', async () => {
    const blob = await createEncryptedPdfBlob('secret');
    const file = new File([blob], 'test.pdf', { type: 'application/pdf' });
    
    await expect(unlockPdf(file, 'wrong')).rejects.toThrow(WrongPasswordError);
  });
});
