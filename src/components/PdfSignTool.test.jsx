import { render } from 'preact';
import { act } from 'preact/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';
import PdfSignTool from './PdfSignTool.jsx';

function makePdfFile(name) {
  return new File(['%PDF-1.4'], name, { type: 'application/pdf' });
}

// Mock getDocument because we don't want to load actual pdf.js workers in jsdom environment
vi.mock('pdfjs-dist', () => {
  return {
    GlobalWorkerOptions: {
      workerSrc: ''
    },
    getDocument: vi.fn(() => ({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi.fn(() => Promise.resolve({
          getViewport: () => ({ width: 612, height: 792 }),
          render: () => ({ promise: Promise.resolve() })
        }))
      })
    }))
  };
});

describe('PdfSignTool UI flow', () => {
  let container;

  afterEach(() => {
    if (container) {
      act(() => render(null, container));
      container.remove();
      container = null;
    }
    vi.restoreAllMocks();
  });

  it('renders the initial file dropper zone', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfSignTool />, container);
    });

    const dropzone = container.querySelector('.dropzone');
    expect(dropzone).not.toBeNull();
    expect(dropzone.textContent).toContain('Drop PDF here');
  });

  it('transitions to loading and editing state when a file is selected', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfSignTool />, container);
    });

    const input = container.querySelector('input[type="file"]');
    const file = makePdfFile('test_agreement.pdf');

    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait for chained async operations (getPdfjs -> arrayBuffer -> getDocument) to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // It should now show "Signing: test_agreement.pdf"
    const header = container.querySelector('.list-count');
    expect(header).not.toBeNull();
    expect(header.textContent).toContain('Signing: test_agreement.pdf');
  });

  it('loads saved signatures from localStorage on mount', async () => {
    const mockSignature = {
      id: 'sig-test-123',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      aspectRatio: 1
    };
    localStorage.setItem('pdf-toolkit:signatures', JSON.stringify([mockSignature]));

    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfSignTool />, container);
    });

    const file = makePdfFile('test.pdf');
    const input = container.querySelector('input[type="file"]');
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Locate the signature tool button in the toolbar
    const toolbarButtons = container.querySelectorAll('.sign-tool-btn');
    const sigBtn = Array.from(toolbarButtons).find(btn => btn.textContent.includes('Signature'));
    expect(sigBtn).not.toBeNull();

    // Clicking signature button when saved signatures exist should toggle the dropdown
    await act(async () => {
      sigBtn.click();
    });

    const dropdown = container.querySelector('.sign-dropdown-menu');
    expect(dropdown).not.toBeNull();

    const dropdownItems = container.querySelectorAll('.sign-dropdown-item');
    expect(dropdownItems.length).toBe(1);

    // Clicking the item should close dropdown and select tool
    await act(async () => {
      dropdownItems[0].click();
    });

    const dropdownAfter = container.querySelector('.sign-dropdown-menu');
    expect(dropdownAfter).toBeNull();
  });

  it('allows opening the signature dialog and changing modes', async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      render(<PdfSignTool />, container);
    });

    const file = makePdfFile('test.pdf');
    const input = container.querySelector('input[type="file"]');
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    // Clicking Signature when local storage is empty opens the dialog directly
    localStorage.removeItem('pdf-toolkit:signatures');
    const toolbarButtons = container.querySelectorAll('.sign-tool-btn');
    const sigBtn = Array.from(toolbarButtons).find(btn => btn.textContent.includes('Signature'));
    
    await act(async () => {
      sigBtn.click();
    });

    const dialog = container.querySelector('dialog');
    expect(dialog).not.toBeNull();

    // Verify Draw, Type, Upload tabs are present
    const tabBtns = container.querySelectorAll('.sig-tab-btn');
    expect(tabBtns.length).toBe(3);
    expect(tabBtns[0].textContent).toBe('Draw');
    expect(tabBtns[1].textContent).toBe('Type');
    expect(tabBtns[2].textContent).toBe('Upload');

    // Switch to Type mode
    await act(async () => {
      tabBtns[1].click();
    });
    
    // Switch to Upload mode
    await act(async () => {
      tabBtns[2].click();
    });

    const dropzone = container.querySelector('.sig-upload-dropzone');
    expect(dropzone).not.toBeNull();
  });
});
