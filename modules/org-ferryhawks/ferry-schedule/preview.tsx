'use client';
import { useEffect, useState } from 'react';
import { flexGap } from '@/lib/flexGap';
import { OrgCustomSlide } from '@/config/orgs/ferryhawks';
import Footer from '@/components/shared-components/footer';

interface FerryDeparture {
  time: string;
  timestamp: number;
  destination: string;
  isRealTime: boolean;
}

interface FerryData {
  siFerry: FerryDeparture[];
  nycFerry: FerryDeparture[];
}

function ServiceIcon({ size }: { type: 'si' | 'nyc'; size: string | number; color: string }) {
  return (
    <img src="/images/ferry-icon.png" alt="" style={{ width: size, height: size, objectFit: 'contain' }} />
  );
}

function DepartureRow({
  dep,
  isFirst,
  textColor,
  accentColor,
  isEditor,
  contentMult,
}: {
  dep: FerryDeparture;
  isFirst: boolean;
  textColor: string;
  accentColor: string;
  isEditor: boolean;
  contentMult: number;
}) {
  const minsFromNow = Math.round((dep.timestamp - Date.now()) / 60000);
  const countdownColor = minsFromNow <= 5 ? '#f87171' : minsFromNow <= 15 ? '#fbbf24' : textColor;

  return (
    <div
      className="hgap"
      style={{
        display: 'flex',
        alignItems: 'center',
        ...flexGap(isEditor ? '8px' : 'calc(1.2*var(--cqh))'),
        padding: isEditor ? '8px 14px' : 'calc(1.2*var(--cqh)) calc(2*var(--cqh))',
        borderTop: isFirst ? 'none' : '1px solid rgba(255,255,255,0.08)',
        backgroundColor: isFirst ? 'rgba(255,255,255,0.04)' : 'transparent',
      }}
    >
      {/* Time */}
      <div style={{
        fontWeight: 700,
        fontSize: isEditor ? `${26 * contentMult}px` : `calc(${4.2 * contentMult}*var(--cqh))`,
        color: textColor,
        minWidth: isEditor ? 85 : 'calc(12*var(--cqh))',
        flexShrink: 0,
        letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {dep.time}
      </div>

      {/* Countdown */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        minWidth: isEditor ? 78 : 'calc(10*var(--cqh))',
        flexShrink: 0,
      }}>
        {dep.isRealTime && (
          <span style={{
            width: isEditor ? 7 : 'calc(0.9*var(--cqh))',
            height: isEditor ? 7 : 'calc(0.9*var(--cqh))',
            minWidth: isEditor ? 7 : 'calc(0.9*var(--cqh))',
            marginRight: isEditor ? 4 : 'calc(0.5*var(--cqh))',
            borderRadius: '50%',
            backgroundColor: '#4ade80',
            display: 'inline-block',
            flexShrink: 0,
          }} />
        )}
        <span style={{
          fontWeight: 600,
          fontSize: isEditor ? `${19 * contentMult}px` : `calc(${3 * contentMult}*var(--cqh))`,
          color: countdownColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {minsFromNow <= 0 ? 'Now' : `${minsFromNow} min`}
        </span>
      </div>

      {/* Destination */}
      <div style={{
        flex: 1,
        fontSize: isEditor ? `${15 * contentMult}px` : `calc(${2.6 * contentMult}*var(--cqh))`,
        color: textColor,
        opacity: 0.8,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {dep.destination}
      </div>

      {/* Badge */}
      <div style={{
        fontSize: isEditor ? `${9 * contentMult}px` : `calc(${1.4 * contentMult}*var(--cqh))`,
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
        color: dep.isRealTime ? '#4ade80' : textColor,
        opacity: dep.isRealTime ? 1 : 0.4,
        border: `1px solid ${dep.isRealTime ? '#4ade8055' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: isEditor ? 3 : 'calc(0.4*var(--cqh))',
        padding: isEditor ? '2px 5px' : 'calc(0.25*var(--cqh)) calc(0.7*var(--cqh))',
        flexShrink: 0,
      }}>
        {dep.isRealTime ? 'Live' : 'Sched'}
      </div>
    </div>
  );
}

function ServicePanel({
  label,
  icon,
  accentColor,
  textColor,
  departures,
  maxRows,
  isEditor,
  contentMult,
}: {
  label: string;
  icon: 'si' | 'nyc';
  accentColor: string;
  textColor: string;
  departures: FerryDeparture[];
  maxRows: number;
  isEditor: boolean;
  contentMult: number;
}) {
  const now = Date.now();
  const upcoming = departures.filter(d => d.timestamp > now - 30000).slice(0, maxRows);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: isEditor ? 8 : 'calc(1*var(--cqh))',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="hgap" style={{
        display: 'flex',
        alignItems: 'center',
        ...flexGap(isEditor ? '8px' : 'calc(1*var(--cqh))'),
        padding: isEditor ? '9px 14px' : 'calc(1.3*var(--cqh)) calc(2*var(--cqh))',
        backgroundColor: `${accentColor}22`,
        borderBottom: `2px solid ${accentColor}`,
        color: accentColor,
        flexShrink: 0,
      }}>
        <ServiceIcon type={icon} size={isEditor ? 22 : 'calc(3.2*var(--cqh))'} color={accentColor} />
        <span style={{
          fontWeight: 800,
          fontSize: isEditor ? `${16 * contentMult}px` : `calc(${2.8 * contentMult}*var(--cqh))`,
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
        }}>
          {label}
        </span>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: upcoming.length ? 'flex-start' : 'center' }}>
        {upcoming.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: textColor,
            opacity: 0.35,
            fontSize: isEditor ? `${13 * contentMult}px` : `calc(${2 * contentMult}*var(--cqh))`,
            padding: isEditor ? '16px' : 'calc(2*var(--cqh))',
          }}>
            No departures available
          </div>
        ) : (
          upcoming.map((dep, i) => (
            <DepartureRow
              key={dep.timestamp + dep.destination + i}
              dep={dep}
              isFirst={i === 0}
              textColor={textColor}
              accentColor={accentColor}
              isEditor={isEditor}
              contentMult={contentMult}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function FerrySchedulePreview({ config, isEditor = false, showFooter = true }: { config: OrgCustomSlide; isEditor?: boolean; showFooter?: boolean }) {
  const [ferryData, setFerryData] = useState<FerryData | null>(null);
  const [, setTick] = useState(0);

  const fetchData = async () => {
    try {
      const resp = await fetch('/api/ferry/departures');
      if (resp.ok) setFerryData(await resp.json());
    } catch {
      // leave stale data on screen
    }
  };

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, 60000);
    const tick = setInterval(() => setTick(n => n + 1), 30000);
    return () => { clearInterval(refresh); clearInterval(tick); };
  }, []);

  const bg = config.backgroundColor ?? '#0D1B2A';
  const textColor = config.textColor ?? '#ffffff';
  const siAccent = config.siAccentColor ?? '#F7941D';
  const nycAccent = config.nycAccentColor ?? '#00A5CE';
  const title = config.title ?? 'FERRIES FROM ST. GEORGE';
  const maxRows: number = config.maxRows ?? 4;
  const contentMult = 0.5 + (config.contentTextSize ?? 5) * 0.1;
  const titleMult = 0.5 + (config.titleTextSize ?? 5) * 0.1;

  const panels = [
    config.showSIFerry !== false && {
      label: 'Staten Island Ferry',
      icon: 'si' as const,
      accentColor: siAccent,
      departures: ferryData?.siFerry ?? [],
    },
    config.showNYCFerry !== false && {
      label: 'NYC Ferry',
      icon: 'nyc' as const,
      accentColor: nycAccent,
      departures: ferryData?.nycFerry ?? [],
    },
  ].filter(Boolean) as { label: string; icon: 'si' | 'nyc'; accentColor: string; departures: FerryDeparture[] }[];

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ backgroundColor: bg, color: textColor }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isEditor ? '10px 14px' : 'calc(1.6*var(--cqh)) calc(2.5*var(--cqh))',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}>
        <div className="hgap" style={{ display: 'flex', alignItems: 'center', ...flexGap(isEditor ? '8px' : 'calc(1*var(--cqh))') }}>
          <img
            className="leg-icon"
            src="/images/ferry-icon.png"
            style={{ width: 80 }}
            alt=""
          />
          <span style={{
            fontWeight: 800,
            fontSize: isEditor ? `${22 * titleMult}px` : `calc(${6 * titleMult}*var(--cqh))`,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            color: textColor,
          }}>
            {title}
          </span>
        </div>
        <img
          src="/ferryhawks/Bobby-Dark.png"
          alt="FerryHawks"
          style={{
            height: isEditor ? 72 : 'calc(14*var(--cqh))',
            width: 'auto',
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      </div>

      {/* Panels */}
      <div className={panels.length === 1 ? 'vgap' : 'hgap'} style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: panels.length === 1 ? 'column' : 'row',
        ...flexGap(isEditor ? '10px' : 'calc(1.5*var(--cqh))'),
        padding: isEditor ? '10px' : 'calc(1.5*var(--cqh))',
        overflow: 'hidden',
      }}>
        {panels.map(panel => (
          <ServicePanel
            key={panel.label}
            label={panel.label}
            icon={panel.icon}
            accentColor={panel.accentColor}
            textColor={textColor}
            departures={panel.departures}
            maxRows={maxRows}
            isEditor={isEditor}
            contentMult={contentMult}
          />
        ))}
      </div>
      {showFooter && <Footer />}
    </div>
  );
}
