import { render } from 'preact';
import { act } from 'preact/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';
import PdfSplitTool from './PdfSplitTool.jsx';
import { parsePageSelector, pageNumbersToRangeString } from '../lib/split.js';

// Test split.js library
describe('split.js library helpers', () => {
  it('parses page ranges correctly', () => {
    expect(parsePageSelector('', 5)).toEqual([1, 2, 3, 4, 5]);
    expect(parsePageSelector('1-3', 5)).toEqual([1, 2, 3]);
    expect(parsePageSelector('1-3, 5', 5)).toEqual([1, 2, 3, 5]);
    expect(parsePageSelector(' 3-1,  4 ', 5)).toEqual([1, 2, 3, 4]);
    expect(parsePageSelector('8-', 10)).toEqual([8, 9, 10]);
    expect(parsePageSelector('-3', 5)).toEqual([1, 2, 3]);
  });

  it('throws errors on invalid ranges', () => {
    expect(() => parsePageSelector('6', 5)).toThrow();
    expect(() => parsePageSelector('1-6', 5)).toThrow();
    expect(() => parsePageSelector('abc', 5)).toThrow();
    expect(() => parsePageSelector('1-2-3', 5)).toThrow();
  });

  it('converts page numbers back to range strings', () => {
    expect(pageNumbersToRangeString([])).toBe('');
    expect(pageNumbersToRangeString([1, 2, 3])).toBe('1-3');
    expect(pageNumbersToRangeString([1, 2, 3, 5])).toBe('1-3, 5');
    expect(pageNumbersToRangeString([1, 3, 4, 5, 7, 8])).toBe('1, 3-5, 7-8');
  });
});

function makePdfFile(name) {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

const { mockState } = vi.hoisted(() => ({ mockState: { numPages: 4 } }));

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => {
  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn(() => ({
      promise: Promise.resolve({
        get numPages() {
          return mockState.numPages;
        },
        getPage: vi.fn(() =>
          Promise.resolve({
            getViewport: () => ({ width: 600, height: 800 }),
            render: () => ({ promise: Promise.resolve() }),
          }),
        ),
      }),
      destroy: vi.fn(() => Promise.resolve()),
    })),
  };
});

// Mock @cantoo/pdf-lib
vi.mock('@cantoo/pdf-lib', () => {
  return {
    PDFDocument: {
      create: vi.fn(() =>
        Promise.resolve({
          copyPages: vi.fn(() => Promise.resolve(['page1', 'page2'])),
          addPage: vi.fn(),
          save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
        })
      ),
      load: vi.fn(() =>
        Promise.resolve({
          copyPages: vi.fn(() => Promise.resolve(['page1'])),
          addPage: vi.fn(),
          save: vi.fn(() => Promise.resolve(new Uint8Array([4, 5, 6]))),
        })
      ),
    },
  };
});

describe('PdfSplitTool UI flow', () => {
  let container;

  afterEach(() => {
    if (container) {
      act(() => render(null, container));
      container.remove();
      container = null;
    }
    mockState.numPages = 4;
    vi.restoreAllMocks();
  });

  it('renders initial dropzone', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfSplitTool />, container);
    });

    const dropzone = container.querySelector('.dropzone');
    expect(dropzone).not.toBeNull();
    expect(dropzone.textContent).toContain('Drop PDF here');
  });

  it('loads file and populates page grid', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:fake-url');
    URL.revokeObjectURL = vi.fn();

    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfSplitTool />, container);
    });

    const input = container.querySelector('input[type="file"]');
    const file = makePdfFile('test.pdf');

    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait for the async loader to finish
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const workspace = container.querySelector('.tool-workspace');
    expect(workspace).not.toBeNull();
    expect(workspace.textContent).toContain('File: test.pdf (4 pages)');

    // Textbox range should default to "1-4"
    const selectorInput = container.querySelector('#page-selector-input');
    expect(selectorInput.value).toBe('1-4');

    // Should render 4 page cards
    const cards = container.querySelectorAll('.page-card');
    expect(cards.length).toBe(4);
  });
});
