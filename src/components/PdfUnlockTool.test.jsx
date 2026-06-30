import { render } from 'preact';
import { act } from 'preact/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';
import PdfUnlockTool from './PdfUnlockTool.jsx';
import { WrongPasswordError } from '../lib/unlock.js';

function makePdfFile(name) {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

vi.mock('../lib/unlock.js', () => {
  class WrongPasswordError extends Error {}
  return {
    WrongPasswordError,
    unlockPdf: vi.fn((file, password) => {
      if (password !== 'correct') return Promise.reject(new WrongPasswordError());
      return Promise.resolve(new Blob(['%PDF-1.4-unlocked'], { type: 'application/pdf' }));
    }),
  };
});

describe('PdfUnlockTool UI flow', () => {
  let container;

  afterEach(() => {
    if (container) {
      act(() => render(null, container));
      container.remove();
      container = null;
    }
    vi.restoreAllMocks();
  });

  function mount() {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfUnlockTool />, container);
    });
  }

  async function loadFile(name = 'protected.pdf') {
    const input = container.querySelector('input[type="file"]');
    const file = makePdfFile(name);
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  it('renders the initial file dropper zone', () => {
    mount();
    const dropzone = container.querySelector('.dropzone');
    expect(dropzone).not.toBeNull();
    expect(dropzone.textContent).toContain('Drop PDF here');
  });

  it('shows a password field once a file is loaded', async () => {
    mount();
    await loadFile();

    const header = container.querySelector('.list-count');
    expect(header.textContent).toContain('protected.pdf');

    const passwordInput = container.querySelector('.unlock-password-input');
    expect(passwordInput).not.toBeNull();

    const submitBtn = container.querySelector('.merge-button');
    expect(submitBtn.disabled).toBe(true);
  });

  it('shows an error message for the wrong password', async () => {
    mount();
    await loadFile();

    const passwordInput = container.querySelector('.unlock-password-input');
    await act(async () => {
      passwordInput.value = 'nope';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const form = container.querySelector('.unlock-form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const error = container.querySelector('.error-message');
    expect(error).not.toBeNull();
    expect(container.querySelector('.download-button')).toBeNull();
  });

  it('unlocks the PDF and produces a download link with the correct password', async () => {
    mount();
    await loadFile();

    const passwordInput = container.querySelector('.unlock-password-input');
    await act(async () => {
      passwordInput.value = 'correct';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const originalCreateObjectURL = window.URL.createObjectURL;
    window.URL.createObjectURL = vi.fn(() => 'blob:testurl');

    const form = container.querySelector('.unlock-form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    const downloadBtn = container.querySelector('.download-button');
    expect(downloadBtn).not.toBeNull();
    expect(downloadBtn.getAttribute('href')).toBe('blob:testurl');
    expect(downloadBtn.getAttribute('download')).toBe('protected_unlocked.pdf');

    window.URL.createObjectURL = originalCreateObjectURL;
  });
});
