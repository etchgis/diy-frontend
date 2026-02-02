import React from "react";

const CLOUD = "M16,36 Q8,36 8,29 Q8,23 14,22 Q15,14 23,12 Q30,12 33,16 Q36,13 40,15 Q44,17 44,22 Q48,23 48,28 Q48,36 40,36 Z";

function Sun({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <circle cx="32" cy="32" r="10" fill="currentColor" opacity="0.9" />
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
        <line x1="32" y1="8" x2="32" y2="16" />
        <line x1="32" y1="48" x2="32" y2="56" />
        <line x1="8" y1="32" x2="16" y2="32" />
        <line x1="48" y1="32" x2="56" y2="32" />
        <line x1="15" y1="15" x2="20.7" y2="20.7" />
        <line x1="43.3" y1="43.3" x2="49" y2="49" />
        <line x1="49" y1="15" x2="43.3" y2="20.7" />
        <line x1="20.7" y1="43.3" x2="15" y2="49" />
      </g>
    </svg>
  );
}

function PartlyCloudy({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <circle cx="44" cy="18" r="8" fill="currentColor" opacity="0.6" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="44" y1="4" x2="44" y2="8" />
        <line x1="56" y1="18" x2="60" y2="18" />
        <line x1="52.5" y1="9.5" x2="55" y2="7" />
        <line x1="52.5" y1="26.5" x2="55" y2="29" />
        <line x1="35.5" y1="9.5" x2="33" y2="7" />
      </g>
      <path
        d="M14,48 Q6,48 6,41 Q6,35 12,34 Q13,26 21,24 Q28,24 31,28 Q34,25 38,27 Q42,29 42,34 Q46,35 46,40 Q46,48 38,48 Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

function Cloud({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <path d={CLOUD} fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function Fog({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <path
        d="M16,32 Q8,32 8,25 Q8,19 14,18 Q15,10 23,8 Q30,8 33,12 Q36,9 40,11 Q44,13 44,18 Q48,19 48,24 Q48,32 40,32 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5">
        <line x1="10" y1="40" x2="54" y2="40" />
        <line x1="14" y1="47" x2="50" y2="47" />
        <line x1="18" y1="54" x2="46" y2="54" />
      </g>
    </svg>
  );
}

function Drizzle({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <path d={CLOUD} fill="currentColor" opacity="0.8" />
      <g fill="currentColor" opacity="0.5">
        <circle cx="20" cy="44" r="1.8" />
        <circle cx="32" cy="44" r="1.8" />
        <circle cx="44" cy="44" r="1.8" />
        <circle cx="26" cy="52" r="1.8" />
        <circle cx="38" cy="52" r="1.8" />
      </g>
    </svg>
  );
}

function Rain({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <path d={CLOUD} fill="currentColor" opacity="0.8" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <line x1="19" y1="41" x2="17" y2="49" />
        <line x1="28" y1="41" x2="26" y2="49" />
        <line x1="37" y1="41" x2="35" y2="49" />
        <line x1="23" y1="50" x2="21" y2="56" />
        <line x1="32" y1="50" x2="30" y2="56" />
      </g>
    </svg>
  );
}

function Snow({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <path d={CLOUD} fill="currentColor" opacity="0.8" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6">
        <line x1="20" y1="41" x2="20" y2="47" />
        <line x1="17" y1="44" x2="23" y2="44" />
        <line x1="34" y1="41" x2="34" y2="47" />
        <line x1="31" y1="44" x2="37" y2="44" />
        <line x1="27" y1="50" x2="27" y2="56" />
        <line x1="24" y1="53" x2="30" y2="53" />
      </g>
    </svg>
  );
}

function Thunderstorm({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" style={style} fill="none">
      <path
        d="M16,32 Q8,32 8,25 Q8,19 14,18 Q15,10 23,8 Q30,8 33,12 Q36,9 40,11 Q44,13 44,18 Q48,19 48,24 Q48,32 40,32 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <polygon
        points="34,32 28,44 33,44 26,58 38,42 33,42 38,32"
        fill="currentColor"
        opacity="0.9"
      />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4">
        <line x1="16" y1="38" x2="14" y2="46" />
        <line x1="44" y1="38" x2="42" y2="46" />
      </g>
    </svg>
  );
}

export default function WeatherIcon({
  code,
  size = "1em",
}: {
  code: number;
  size?: string;
}) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    display: "inline-block",
    flexShrink: 0,
  };

  if (code === 0) return <Sun style={style} />;
  if (code <= 3) return <PartlyCloudy style={style} />;
  if (code <= 48) return <Fog style={style} />;
  if (code <= 57) return <Drizzle style={style} />;
  if (code <= 67) return <Rain style={style} />;
  if (code <= 77) return <Snow style={style} />;
  if (code <= 82) return <Rain style={style} />;
  if (code <= 86) return <Snow style={style} />;
  if (code <= 99) return <Thunderstorm style={style} />;
  return <Cloud style={style} />;
}
