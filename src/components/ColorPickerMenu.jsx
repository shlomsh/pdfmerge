import { useDropdownMenu } from '../lib/useDropdownMenu.js';
import ColorPicker from './ColorPicker.jsx';

// Compact trigger + popover wrapper around ColorPicker, reusing the same
// dropdown-container/backdrop/menu pattern as the saved-signatures dropdown
// (PdfSignTool.jsx) so the per-element floating toolbar only shows a single
// swatch button instead of the full palette inline.
export default function ColorPickerMenu({ value, onChange, title, defaultColor = '#000000' }) {
  const { open, setOpen, containerRef, triggerRef, menuRef } = useDropdownMenu();

  const swatchColor = value || defaultColor;

  return (
    <div className="sign-tool-dropdown-container" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="sign-element-btn sign-color-trigger"
        onClick={() => setOpen((o) => !o)}
        title={title}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="sign-color-trigger-swatch" style={{ background: swatchColor }} />
      </button>
      {open && (
        <>
          <div className="sign-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div ref={menuRef} className="sign-dropdown-menu sign-color-menu" role="menu">
            <ColorPicker
              value={value}
              onChange={(color) => {
                onChange(color);
                setOpen(false);
              }}
              title={title}
              defaultColor={defaultColor}
            />
          </div>
        </>
      )}
    </div>
  );
}
