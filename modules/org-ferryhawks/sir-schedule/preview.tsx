"use client";
import { useEffect, useState } from "react";
import { OrgCustomSlide } from "@/config/orgs/ferryhawks";
import type { SIRDeparture } from "@/app/api/sir/departures/route";

function SIRIcon({ size, color }: { size: string | number; color: string }) {
  // Simplified rail/train icon
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="4" y="3" width="16" height="13" rx="2" opacity="0.9" />
      <rect
        x="7"
        y="6"
        width="4"
        height="4"
        rx="0.5"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.7"
      />
      <rect
        x="13"
        y="6"
        width="4"
        height="4"
        rx="0.5"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.7"
      />
      <path d="M7 19l2-3h6l2 3" opacity="0.6" />
      <rect x="6" y="19" width="12" height="2" rx="1" opacity="0.4" />
    </svg>
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
  dep: SIRDeparture;
  isFirst: boolean;
  textColor: string;
  accentColor: string;
  isEditor: boolean;
  contentMult: number;
}) {
  const minsFromNow = Math.round((dep.timestamp - Date.now()) / 60000);
  const countdownColor =
    minsFromNow <= 5 ? "#f87171" : minsFromNow <= 15 ? "#fbbf24" : textColor;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: isEditor ? 14 : "2.5vh",
        padding: isEditor ? "8px 14px" : "1.2vh 2vh",
        borderTop: isFirst ? "none" : "1px solid rgba(255,255,255,0.08)",
        backgroundColor: isFirst ? "rgba(255,255,255,0.04)" : "transparent",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: isEditor
            ? `${26 * contentMult}px`
            : `${4.2 * contentMult}vh`,
          color: textColor,
          minWidth: isEditor ? 85 : "12vh",
          flexShrink: 0,
          letterSpacing: "-0.01em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {dep.time}
      </div>

      <div
        style={{
          minWidth: isEditor ? 78 : "10vh",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: isEditor
              ? `${19 * contentMult}px`
              : `${3 * contentMult}vh`,
            color: countdownColor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {minsFromNow <= 0 ? "Now" : `${minsFromNow} min`}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          fontSize: isEditor
            ? `${15 * contentMult}px`
            : `${2.6 * contentMult}vh`,
          color: textColor,
          opacity: 0.8,
          whiteSpace: "nowrap" as const,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {dep.destination}
      </div>

      <div
        style={{
          fontSize: isEditor
            ? `${9 * contentMult}px`
            : `${1.4 * contentMult}vh`,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase" as const,
          color: textColor,
          opacity: 0.4,
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: isEditor ? 3 : "0.4vh",
          padding: isEditor ? "2px 5px" : "0.25vh 0.7vh",
          flexShrink: 0,
        }}
      >
        Sched
      </div>
    </div>
  );
}

export default function SIRSchedulePreview({
  config,
  isEditor = false,
}: {
  config: OrgCustomSlide;
  isEditor?: boolean;
}) {
  const [departures, setDepartures] = useState<SIRDeparture[]>([]);
  const [, setTick] = useState(0);

  const fetchData = async () => {
    try {
      const resp = await fetch("/api/sir/departures");
      if (resp.ok) {
        const data = await resp.json();
        setDepartures(data.departures ?? []);
      }
    } catch {
      // leave stale data
    }
  };

  useEffect(() => {
    fetchData();
    const refresh = setInterval(fetchData, 60000);
    const tick = setInterval(() => setTick((n) => n + 1), 30000);
    return () => {
      clearInterval(refresh);
      clearInterval(tick);
    };
  }, []);

  const bg = config.backgroundColor ?? "#0D1B2A";
  const textColor = config.textColor ?? "#ffffff";
  const accentColor = config.accentColor ?? "#0039A6";
  const title = config.title ?? "STATEN ISLAND RAILWAY";
  const maxRows: number = config.maxRows ?? 5;
  const contentMult = 0.5 + (config.contentTextSize ?? 5) * 0.1;
  const titleMult = 0.5 + (config.titleTextSize ?? 5) * 0.1;

  const now = new Date();
  const clockStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const upcoming = departures
    .filter((d) => d.timestamp > Date.now() - 30000)
    .slice(0, maxRows);

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: bg, color: textColor }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isEditor ? "10px 14px" : "1.6vh 2.5vh",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: isEditor ? 8 : "1vh",
          }}
        >
          <img
            className="leg-icon"
            src="/images/rail-icon.png"
            style={{ width: 80 }}
            alt=""
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: isEditor ? `${22 * titleMult}px` : `${6 * titleMult}vh`,
              letterSpacing: "0.04em",
              textTransform: "uppercase" as const,
            }}
          >
            {title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isEditor ? 10 : "1.5vh" }}>
          <span
            style={{
              fontSize: isEditor ? `${18 * contentMult}px` : `${4 * contentMult}vh`,
              opacity: 0.6,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {clockStr}
          </span>
          <img
            src="/ferryhawks/logo-2.png"
            alt="FerryHawks"
            style={{
              height: isEditor ? 44 : "7.5vh",
              width: "auto",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: isEditor ? 14 : "2.5vh",
          padding: isEditor ? "5px 14px" : "0.7vh 2vh",
          borderBottom: `2px solid ${accentColor}`,
          backgroundColor: `${accentColor}22`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: isEditor
              ? `${10 * contentMult}px`
              : `${3 * contentMult}vh`,
            color: accentColor,
            minWidth: isEditor ? 85 : "12vh",
            flexShrink: 0,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          Departs
        </div>
        <div
          style={{
            fontWeight: 700,
            fontSize: isEditor
              ? `${10 * contentMult}px`
              : `${3 * contentMult}vh`,
            color: accentColor,
            minWidth: isEditor ? 78 : "10vh",
            flexShrink: 0,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          In
        </div>
        <div
          style={{
            flex: 1,
            fontWeight: 700,
            fontSize: isEditor
              ? `${10 * contentMult}px`
              : `${3 * contentMult}vh`,
            color: accentColor,
            letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
          }}
        >
          To
        </div>
      </div>

      {/* Rows */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column" as const,
          justifyContent: upcoming.length ? "flex-start" : "center",
        }}
      >
        {upcoming.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: textColor,
              opacity: 0.35,
              fontSize: isEditor
                ? `${13 * contentMult}px`
                : `${2 * contentMult}vh`,
              padding: isEditor ? "20px" : "3vh",
            }}
          >
            No upcoming departures
          </div>
        ) : (
          upcoming.map((dep, i) => (
            <DepartureRow
              key={dep.timestamp + i}
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

      {/* Footer */}
      <div
        style={{
          padding: isEditor ? "5px 14px" : "0.7vh 2vh",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: isEditor
            ? `${9 * contentMult}px`
            : `${1.4 * contentMult}vh`,
          color: textColor,
          opacity: 0.35,
          flexShrink: 0,
        }}
      >
        Departures from St. George · Scheduled times
      </div>
    </div>
  );
}
