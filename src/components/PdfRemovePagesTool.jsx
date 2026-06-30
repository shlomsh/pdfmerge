import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { PDFDocument } from '@cantoo/pdf-lib';
import { removePages } from '../lib/removePages.js';
import { renderPdfThumbnails } from '../lib/thumbnails.js';
import BasePdfTool from './BasePdfTool.jsx';

const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * 18;

export default function PdfRemovePagesTool() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); // array of { pageNumber, thumbnail }
  const [removedIndices, setRemovedIndices] = useState(new Set()); // 0-indexed indices of pages to remove
  const [status, setStatus] = useState('idle'); // idle | loading-file | processing | done | error
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const downloadRef = useRef(null);

  useEffect(() => {
    if (status === 'done' && downloadRef.current) {
      downloadRef.current.focus();
    }
  }, [status]);

  const resetOutput = () => {
    setStatus('idle');
    setProgress(0);
    setDownloadUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  };

  const handleFilesAdded = useCallback(async (fileList) => {
    const pdfs = Array.from(fileList).filter((f) => f.type === 'application/pdf');
    if (pdfs.length === 0) return;
    const selectedFile = pdfs[0];

    setFile(selectedFile);
    setStatus('loading-file');
    setProgress(0);
    setRemovedIndices(new Set());
    setDownloadUrl(null);
    setPages([]);

    try {
      const bytes = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      // Initialize the pages list with placeholders (shimmer effect)
      const initialPages = Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        thumbnail: null,
      }));
      setPages(initialPages);
      setStatus('idle');
      setAnnouncement(`Loaded PDF file "${selectedFile.name}" with ${pageCount} pages.`);

      // Render thumbnails sequentially in the background
      renderPdfThumbnails(selectedFile, (pageIndex, dataUrl) => {
        setPages((current) =>
          current.map((p) =>
            p.pageNumber === pageIndex ? { ...p, thumbnail: dataUrl } : p
          )
        );
      }).catch((err) => {
        console.error('Thumbnail generation failed:', err);
      });
    } catch (err) {
      console.error(err);
      setStatus('error');
      setAnnouncement('Failed to load PDF file.');
    }
  }, []);

  const reset = useCallback(() => {
    setFile(null);
    setPages([]);
    setRemovedIndices(new Set());
    setStatus('idle');
    setProgress(0);
    setDownloadUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setAnnouncement('Cleared. Add a PDF to start again.');
  }, []);

  const togglePage = useCallback((index) => {
    setRemovedIndices((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      const pageNum = index + 1;
      const willRemove = next.has(index);
      setAnnouncement(`Page ${pageNum} marked to be ${willRemove ? 'removed' : 'kept'}.`);
      return next;
    });
    resetOutput();
  }, []);

  const keepAll = useCallback(() => {
    setRemovedIndices(new Set());
    resetOutput();
    setAnnouncement('Marked all pages to be kept.');
  }, []);

  const removeAll = useCallback(() => {
    const all = new Set(pages.map((_, i) => i));
    setRemovedIndices(all);
    resetOutput();
    setAnnouncement('Marked all pages to be removed.');
  }, [pages]);

  const invertSelection = useCallback(() => {
    setRemovedIndices((current) => {
      const next = new Set();
      pages.forEach((_, i) => {
        if (!current.has(i)) {
          next.add(i);
        }
      });
      return next;
    });
    resetOutput();
    setAnnouncement('Inverted page selections.');
  }, [pages]);

  const handleRemovePages = async () => {
    if (!file || removedIndices.size === 0 || removedIndices.size === pages.length) return;
    setStatus('processing');
    setProgress(0);
    try {
      const blob = await removePages(file, Array.from(removedIndices), setProgress);
      setDownloadUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return URL.createObjectURL(blob);
      });
      setStatus('done');
      setAnnouncement('Your modified PDF is ready to download.');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setAnnouncement('Failed to remove pages from PDF.');
    }
  };

  const hasFiles = !!file;
  const isAllRemoved = removedIndices.size === pages.length;
  const isNoneRemoved = removedIndices.size === 0;
  const actionButtonDisabled = isAllRemoved || isNoneRemoved || status === 'processing';

  let actionButtonText = 'Remove Pages';
  if (status === 'processing') {
    actionButtonText = 'Processing…';
  } else if (isAllRemoved) {
    actionButtonText = 'Cannot remove all pages';
  } else if (isNoneRemoved) {
    actionButtonText = 'Select pages to remove';
  } else {
    const count = removedIndices.size;
    actionButtonText = `Remove ${count} Page${count === 1 ? '' : 's'}`;
  }

  const ringOffset = PROGRESS_RING_CIRCUMFERENCE - progress * PROGRESS_RING_CIRCUMFERENCE;

  return (
    <BasePdfTool hasFiles={hasFiles} onFilesAdded={handleFilesAdded} multiple={false}>
      {hasFiles && (
        <div class="tool-workspace">
          <div class="list-header">
            <span class="list-count">
              {file.name} ({pages.length} page{pages.length === 1 ? '' : 's'})
            </span>
            <button type="button" class="clear-all" onClick={reset}>
              Start over
            </button>
          </div>

          {status === 'loading-file' ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-muted)' }}>Loading PDF file structure…</p>
            </div>
          ) : (
            <>
              <div class="grid-actions" role="toolbar" aria-label="Selection toolbar">
                <button type="button" onClick={keepAll}>
                  Keep all
                </button>
                <button type="button" onClick={removeAll}>
                  Remove all
                </button>
                <button type="button" onClick={invertSelection}>
                  Invert
                </button>
              </div>

              <div class="pages-grid" role="group" aria-label="PDF Pages Grid">
                {pages.map((page, index) => {
                  const isRemoved = removedIndices.has(index);
                  return (
                    <button
                      key={page.pageNumber}
                      type="button"
                      class={`page-card${isRemoved ? ' is-removed' : ' is-selected'}`}
                      onClick={() => togglePage(index)}
                      aria-label={`Page ${page.pageNumber}${isRemoved ? ', marked for removal' : ', kept'}. Click to toggle.`}
                    >
                      <span class="page-card-checkbox" aria-hidden="true">
                        {!isRemoved ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        )}
                      </span>

                      <div class="page-card-thumb-container">
                        {page.thumbnail ? (
                          <img class="page-card-thumb" src={page.thumbnail} alt="" />
                        ) : (
                          <span class="thumb-placeholder" style={{ width: '100%', height: '100%' }} />
                        )}
                      </div>

                      <span class="page-card-number">Page {page.pageNumber}</span>
                    </button>
                  );
                })}
              </div>

              {isAllRemoved && (
                <p class="hint-message" role="status" style={{ color: 'var(--color-danger)', textAlign: 'center', marginTop: '0.5rem' }}>
                  A PDF must contain at least one page. Please keep at least one page.
                </p>
              )}

              {isNoneRemoved && (
                <p class="hint-message" role="status" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  Click on page thumbnails above to select which pages to remove.
                </p>
              )}

              <button
                type="button"
                class={`merge-button${status === 'processing' ? ' is-merging' : ''}${status === 'done' ? ' is-done' : ''}`}
                disabled={actionButtonDisabled}
                onClick={handleRemovePages}
              >
                {status === 'processing' ? (
                  <span class="merge-button-progress">
                    <svg class="progress-ring" width="22" height="22" viewBox="0 0 40 40" aria-hidden="true">
                      <circle class="progress-ring-track" cx="20" cy="20" r="18" />
                      <circle
                        class="progress-ring-fill"
                        cx="20"
                        cy="20"
                        r="18"
                        stroke-dasharray={PROGRESS_RING_CIRCUMFERENCE}
                        stroke-dashoffset={ringOffset}
                      />
                    </svg>
                    Processing… {Math.round(progress * 100)}%
                  </span>
                ) : (
                  actionButtonText
                )}
              </button>

              {status === 'error' && (
                <div class="error-message" role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
                    <path d="M12 8v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                  <span>
                    <strong>That didn't work.</strong> The file may be damaged or
                    password-protected - try another PDF.
                  </span>
                </div>
              )}

              {status === 'done' && downloadUrl && (
                <>
                  <a
                    ref={downloadRef}
                    class="download-button"
                    href={downloadUrl}
                    download={`${file.name.replace(/\.pdf$/i, '')}_modified.pdf`}
                  >
                    <svg class="download-check" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" class="check-circle" />
                      <path d="M7.5 12.5l3 3 6-6.5" class="check-mark" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                    </svg>
                    Download PDF
                  </a>
                  <button type="button" class="start-over" onClick={reset}>
                    Start over
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      <p class="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </BasePdfTool>
  );
}
