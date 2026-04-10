import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Select({ value, onChange, options, placeholder = 'Seleccionar...', disabled, style }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--gap-md)',
          padding: 'var(--pad-input)',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${open ? 'rgba(59,130,246,0.70)' : 'var(--glass-border)'}`,
          background: 'var(--glass-xs)',
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: 14,
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          transition: 'border-color 200ms, box-shadow 200ms',
          boxShadow: open ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transition: 'transform 200ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 200,
            background: 'rgba(13,13,36,0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid var(--glass-border-strong)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset',
            overflow: 'hidden',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {/* Placeholder option */}
          {placeholder && (
            <button
              type="button"
              className="select-option"
              onClick={() => { onChange(''); setOpen(false); }}
              style={optionStyle(value === '')}
            >
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{placeholder}</span>
              {value === '' && <Check size={13} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />}
            </button>
          )}

          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className="select-option"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={optionStyle(isSelected)}
              >
                <span style={{ flex: 1, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {opt.label}
                </span>
                {isSelected && <Check size={13} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />}
              </button>
            );
          })}

          {options.length === 0 && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin opciones
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function optionStyle(isSelected: boolean): React.CSSProperties {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--gap-md)',
    padding: 'var(--space-3) var(--space-4)',
    background: isSelected ? 'rgba(59,130,246,0.18)' : 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    color: 'inherit',
    fontSize: 13.5,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 140ms',
    // hover se maneja con CSS class abajo
  };
}
