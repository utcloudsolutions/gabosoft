import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  accentColor?: string;
  accentGlow?: string;
}

export function KpiCard({
  label, value, sub, icon: Icon,
  trend = 'neutral', trendLabel,
  accentColor = 'var(--primary)',
  accentGlow = 'var(--primary-glow)',
}: KpiCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'   ? 'var(--verde)' :
    trend === 'down' ? 'var(--rojo)'  :
    'rgba(255,255,255,0.35)';

  return (
    <div
      className="glass"
      style={{
        padding: 'var(--pad-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-xl)',
        transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 1px 0 0 rgba(255,255,255,0.10) inset, 0 12px 36px rgba(0,0,0,0.35), 0 0 20px ${accentGlow}`;
        el.style.borderColor = 'rgba(255,255,255,0.20)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '';
        el.style.borderColor = '';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--radius-md)',
          background: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accentColor} 32%, transparent)`,
          boxShadow: `0 0 12px color-mix(in srgb, ${accentColor} 20%, transparent)`,
        }}>
          <Icon size={16} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value */}
      <div>
        <p style={{ color: '#fff', fontSize: 32, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.5px' }}>
          {value}
        </p>
        {sub && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 'var(--gap-xs)' }}>{sub}</p>
        )}
      </div>

      {/* Trend */}
      {trendLabel && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-sm)' }}>
          <TrendIcon size={13} style={{ color: trendColor }} />
          <span style={{ color: trendColor, fontSize: 12 }}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
