import { useDropdownMenu } from '../lib/useDropdownMenu.js';

const FONT_OPTIONS = [
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Arimo', label: 'Arial (Arimo)' },
  { value: 'Assistant', label: 'Hebrew (Assistant)' },
  { value: 'Heebo', label: 'Hebrew (Heebo)' },
  { value: 'TimesRoman', label: 'Times Roman' },
  { value: 'Courier', label: 'Courier' }
];

// Compact "Aa" trigger + popover list, replacing a native <select> whose
// selected-option text (e.g. "Hebrew (Assistant)") was long enough to force
// the whole per-element floating toolbar wide on its own.
export default function FontPickerMenu({ value, onChange }) {
  const { open, setOpen, containerRef, triggerRef, menuRef } = useDropdownMenu();

  const current = FONT_OPTIONS.find((f) => f.value === value) || FONT_OPTIONS[0];

  return (
    <div className="sign-tool-dropdown-container" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="sign-element-btn sign-font-trigger"
        onClick={() => setOpen((o) => !o)}
        title={`Font: ${current.label}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        Aa
      </button>
      {open && (
        <>
          <div className="sign-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div ref={menuRef} className="sign-dropdown-menu sign-font-menu" role="menu">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                role="menuitem"
                className={`sign-font-menu-item${f.value === current.value ? ' active' : ''}`}
                onClick={() => {
                  onChange(f.value);
                  setOpen(false);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
