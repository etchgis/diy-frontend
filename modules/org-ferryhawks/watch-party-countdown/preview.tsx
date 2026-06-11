'use client';
import { useEffect, useState } from 'react';
import { OrgCustomSlide } from '@/config/orgs/ferryhawks';
import Footer from '@/components/shared-components/footer';

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, started: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    started: false,
  };
}

export default function WatchPartyCountdownPreview({ config, showFooter = true }: { config: OrgCustomSlide; showFooter?: boolean }) {
  const eventDate = new Date(config.eventTime ?? '2026-06-29T00:00:00-04:00');
  const [countdown, setCountdown] = useState(() => getCountdown(eventDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown(eventDate));
    }, 30000);
    return () => clearInterval(interval);
  }, [config.eventTime]);

  const bg = config.backgroundColor ?? '#343E48';
  const text = config.textColor ?? '#ffffff';
  const accent = config.accentColor ?? '#e8b400';

  const units = [
    { value: countdown.days, label: 'Days' },
    { value: countdown.hours, label: 'Hours' },
    { value: countdown.minutes, label: 'Min' },
  ];

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative"
      style={{ backgroundColor: bg, color: text, fontFamily: 'inherit' }}
    >
      {/* Top bar: logo left, World Cup branding right */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2vh 3vh',
        flexShrink: 0,
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
      }}>
        <img
          src="/ferryhawks/logo-2.png"
          alt="FerryHawks"
          style={{ height: '9vh', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2vh 4vh',
        gap: '1.8vh',
      }}>

        {/* Headline */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '3.2vh',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            color: text,
            opacity: 0.7,
            marginBottom: '0.4vh',
          }}>
            Staten Island
          </div>
          <div style={{
            fontSize: '5vh',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: '#94b6e5',
            lineHeight: 1,
            marginBottom: '0.3vh',
          }}>
            World Cup
          </div>
          <div style={{
            fontSize: '9vh',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            color: accent,
            lineHeight: 1,
          }}>
            Fan Zone
          </div>
        </div>

        {/* Venue */}
        <div style={{
          fontSize: '2.4vh',
          fontWeight: 500,
          letterSpacing: '0.06em',
          color: text,
          opacity: 0.7,
          textAlign: 'center',
        }}>
          SIUH Community Park · Staten Island, NY
        </div>

        {/* Date pill */}
        <div style={{
          backgroundColor: accent,
          color: '#000000',
          fontWeight: 800,
          fontSize: '3vh',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          padding: '0.8vh 3vh',
          borderRadius: '0.6vh',
          marginTop: '0.5vh',
        }}>
          June 29 – July 2, 2026
        </div>

        {/* Countdown */}
        {!countdown.started ? (
          <div style={{
            display: 'flex',
            gap: '3vh',
            marginTop: '1vh',
          }}>
            {units.map(({ value, label }) => (
              <div key={label} style={{
                display: 'flex',
                flexDirection: 'column' as const,
                alignItems: 'center',
                minWidth: '10vh',
              }}>
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: `1px solid rgba(255,255,255,0.14)`,
                  borderRadius: '1vh',
                  padding: '1.2vh 2vh',
                  fontSize: '6.5vh',
                  fontWeight: 800,
                  color: text,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  minWidth: '7vh',
                  textAlign: 'center',
                }}>
                  {String(value).padStart(2, '0')}
                </div>
                <div style={{
                  fontSize: '1.3vh',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase' as const,
                  color: text,
                  opacity: 0.45,
                  marginTop: '0.7vh',
                }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            fontSize: '5vh',
            fontWeight: 800,
            color: accent,
            letterSpacing: '0.05em',
          }}>
            Happening Now!
          </div>
        )}

        {/* Sub-details */}
        <div style={{
          display: 'flex',
          flexDirection: 'column' as const,
          alignItems: 'center',
          gap: '0.5vh',
          marginTop: '0.5vh',
        }}>
          <div style={{
            fontSize: '2vh',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: text,
            opacity: 0.55,
          }}>
            Weekday Evening Match Viewing
          </div>
          <div style={{
            fontSize: '1.7vh',
            color: text,
            opacity: 0.4,
            letterSpacing: '0.04em',
          }}>
            More Programming Details Coming Soon
          </div>
        </div>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}
