'use client';
import { useEffect, useState } from 'react';
import { OrgCustomSlide } from '@/config/orgs/ferryhawks';

function getCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    started: false,
  };
}

export default function WatchPartyCountdownPreview({ config }: { config: OrgCustomSlide }) {
  const eventDate = new Date(config.eventTime);
  const [countdown, setCountdown] = useState(() => getCountdown(eventDate));

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdown(eventDate)), 1000);
    return () => clearInterval(interval);
  }, [config.eventTime]);

  const bg = config.backgroundColor ?? '#1a2e4a';
  const text = config.textColor ?? '#ffffff';
  const accent = config.accentColor ?? '#e8b400';

  const units = [
    { value: countdown.days, label: 'Days' },
    { value: countdown.hours, label: 'Hours' },
    { value: countdown.minutes, label: 'Min' },
    { value: countdown.seconds, label: 'Sec' },
  ];

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: bg, color: text }}
    >
      {config.logoUrl && (
        <img
          src={config.logoUrl}
          alt="Logo"
          className="absolute top-6 left-6 object-contain"
          style={{ height: '4rem' }}
        />
      )}

      <div className="text-center mb-10">
        {config.eventSubtitle && (
          <div className="text-lg font-light tracking-widest uppercase mb-2" style={{ opacity: 0.6 }}>
            {config.eventSubtitle}
          </div>
        )}
        <div className="text-5xl font-bold mb-3" style={{ color: accent }}>
          {config.eventTitle}
        </div>
        {config.teamA && config.teamB && (
          <div className="text-3xl font-light" style={{ opacity: 0.9 }}>
            {config.teamA} <span style={{ color: accent }}>vs</span> {config.teamB}
          </div>
        )}
      </div>

      {countdown.started ? (
        <div className="text-5xl font-bold" style={{ color: accent }}>
          Game is live!
        </div>
      ) : (
        <div className="flex gap-10">
          {units.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="text-8xl font-bold tabular-nums leading-none"
                style={{ color: accent }}
              >
                {String(value).padStart(2, '0')}
              </div>
              <div className="text-xs tracking-widest uppercase mt-2" style={{ opacity: 0.5 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-sm tracking-wide" style={{ opacity: 0.4 }}>
        {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        {' · '}
        {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
      </div>
    </div>
  );
}
