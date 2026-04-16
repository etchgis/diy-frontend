import { useTrafficCorridorStore, type DestinationTable } from "./store";
import { useGeneralStore } from "@/stores/general";
import { usePathname } from "next/navigation";
import Footer from "@/components/shared-components/footer";
import HtmlTextEditor from "@/components/shared-components/html-text-editor";

const DEFAULT_TABLE: DestinationTable = { destination: '', corridors: [] };
const DEFAULT_TABLES: DestinationTable[] = [DEFAULT_TABLE, DEFAULT_TABLE];

export default function TrafficCorridorPreview({
  slideId,
  previewMode = false,
}: {
  slideId: string;
  previewMode?: boolean;
}) {
  const pathname = usePathname();
  const isEditor = pathname.includes("/editor") && !previewMode;

  const title = useTrafficCorridorStore((state) => state.slides[slideId]?.title || "");
  const setTitle = useTrafficCorridorStore((state) => state.setTitle);
  const showTitle = useTrafficCorridorStore((state) => state.slides[slideId]?.showTitle !== false);
  const backgroundColor = useTrafficCorridorStore((state) => state.slides[slideId]?.backgroundColor || "#192F51");
  const bgImage = useTrafficCorridorStore((state) => state.slides[slideId]?.bgImage || "");
  const logoImage = useTrafficCorridorStore((state) => state.slides[slideId]?.logoImage || "");
  const titleColor = useTrafficCorridorStore((state) => state.slides[slideId]?.titleColor || "#ffffff");
  const textColor = useTrafficCorridorStore((state) => state.slides[slideId]?.textColor || "#ffffff");
  const tableHeaderColor = useTrafficCorridorStore((state) => state.slides[slideId]?.tableHeaderColor || "#78B1DD");
  const rowColor = useTrafficCorridorStore((state) => state.slides[slideId]?.rowColor || "#192F51");
  const tables = useTrafficCorridorStore((state) => state.slides[slideId]?.tables || DEFAULT_TABLES);
  const setTables = useTrafficCorridorStore((state) => state.setTables);
  const showSecondTable = useTrafficCorridorStore((state) => state.slides[slideId]?.showSecondTable ?? false);
  const titleTextSize = useTrafficCorridorStore((state) => state.slides[slideId]?.titleTextSize || 5);
  const contentTextSize = useTrafficCorridorStore((state) => state.slides[slideId]?.contentTextSize || 5);
  const defaultFontFamily = useGeneralStore((state) => state.defaultFontFamily);

  const titleSizeMultiplier = 0.5 + titleTextSize * 0.1;
  const contentSizeMultiplier = 0.5 + contentTextSize * 0.1;

  const table0 = tables[0] ?? DEFAULT_TABLE;
  const table1 = tables[1] ?? DEFAULT_TABLE;

const updateCorridor = (tableIndex: number, corridorIndex: number, field: 'name' | 'time', value: string) => {
    const newTables = tables.map((t, i) => {
      if (i !== tableIndex) return t;
      return {
        ...t,
        corridors: t.corridors.map((c, j) =>
          j === corridorIndex ? { ...c, [field]: value } : c
        ),
      };
    });
    setTables(slideId, newTables);
  };

  const addCorridor = (tableIndex: number) => {
    if ((tables[tableIndex]?.corridors.length ?? 0) >= 3) return;
    const newTables = tables.map((t, i) => {
      if (i !== tableIndex) return t;
      return { ...t, corridors: [...t.corridors, { name: '', time: '' }] };
    });
    setTables(slideId, newTables);
  };

  const removeCorridor = (tableIndex: number, corridorIndex: number) => {
    const newTables = tables.map((t, i) => {
      if (i !== tableIndex) return t;
      return { ...t, corridors: t.corridors.filter((_, j) => j !== corridorIndex) };
    });
    setTables(slideId, newTables);
  };

  const headerFontSize = isEditor
    ? `${20 * contentSizeMultiplier}px`
    : `clamp(1.2rem, ${5 * contentSizeMultiplier}vh, 6rem)`;

  const rowFontSize = isEditor
    ? `${15 * contentSizeMultiplier}px`
    : `clamp(1rem, ${4 * contentSizeMultiplier}vh, 5rem)`;

  const timeFontSize = isEditor
    ? `${15 * contentSizeMultiplier}px`
    : `clamp(1rem, ${4 * contentSizeMultiplier}vh, 5rem)`;

  const headerPadding = isEditor ? undefined : `${1.8 * contentSizeMultiplier}vh 2vw`;
  const rowPadding = isEditor ? undefined : `${1.5 * contentSizeMultiplier}vh 2vw`;

  const renderTable = (tableData: DestinationTable, tableIndex: number) => (
    <div
      key={tableIndex}
      className="flex flex-col overflow-hidden rounded-sm"
      style={{ border: `1px solid ${tableHeaderColor}` }}
    >
      {/* Destination Header */}
      <div
        className={isEditor ? 'px-3 py-2 font-semibold flex items-center' : 'font-semibold flex items-center'}
        style={{
          backgroundColor: tableHeaderColor,
          color: textColor,
          fontSize: headerFontSize,
          minHeight: isEditor ? '40px' : undefined,
          padding: headerPadding,
        }}
      >
        <span style={{ opacity: tableData.destination ? 1 : 0.45 }}>
          {tableData.destination || 'Enter destination above...'}
        </span>
      </div>

      {/* Corridor Rows */}
      {tableData.corridors.map((corridor, corridorIndex) => (
        <div
          key={corridorIndex}
          className={isEditor ? 'flex items-center px-3 py-2' : 'flex items-center'}
          style={{
            backgroundColor: corridorIndex % 2 === 0 ? rowColor : `${rowColor}cc`,
            borderTop: `1px solid ${tableHeaderColor}40`,
            color: textColor,
            minHeight: isEditor ? '36px' : undefined,
            padding: rowPadding,
          }}
        >
          {isEditor ? (
            <>
              <input
                type="text"
                value={corridor.name}
                onChange={(e) => updateCorridor(tableIndex, corridorIndex, 'name', e.target.value)}
                placeholder="Corridor name..."
                className="flex-1 bg-transparent outline-none placeholder-white/40"
                style={{ color: textColor, fontSize: rowFontSize }}
              />
              <input
                type="text"
                value={corridor.time}
                onChange={(e) => updateCorridor(tableIndex, corridorIndex, 'time', e.target.value)}
                placeholder="Time"
                className="w-20 bg-transparent outline-none text-right font-medium placeholder-white/40"
                style={{ color: textColor, fontSize: timeFontSize }}
              />
              <button
                onClick={() => removeCorridor(tableIndex, corridorIndex)}
                className="ml-2 w-5 h-5 rounded-full bg-red-500/70 hover:bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0"
              >
                −
              </button>
            </>
          ) : (
            <>
              <span className="flex-1" style={{ fontSize: rowFontSize }}>{corridor.name}</span>
              <span className="font-semibold tabular-nums" style={{ fontSize: timeFontSize }}>{corridor.time}</span>
            </>
          )}
        </div>
      ))}

      {/* Add Corridor Button (editor only) */}
      {isEditor && tableData.corridors.length < 3 && (
        <button
          onClick={() => addCorridor(tableIndex)}
          className="w-full py-1.5 text-xs font-medium opacity-60 hover:opacity-100 transition-opacity"
          style={{
            backgroundColor: `${rowColor}80`,
            color: textColor,
            borderTop: `1px dashed ${tableHeaderColor}60`,
          }}
        >
          + Add Corridor
        </button>
      )}
    </div>
  );

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: !bgImage ? backgroundColor : undefined,
        backgroundImage: bgImage ? `url(${bgImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: textColor,
        fontFamily: defaultFontFamily && defaultFontFamily !== 'System Default' ? defaultFontFamily : undefined,
      }}
    >
      {/* Title + Logo */}
      {showTitle && (
        <div className="px-4 py-3 border-b border-white/20 flex-shrink-0 flex items-center">
          <div
            className={`flex-1 rounded px-3 ${isEditor ? 'border-2 border-[#11d1f7] py-1' : ''}`}
          >
            {isEditor ? (
              <HtmlTextEditor
                content={title}
                onChange={(html) => setTitle(slideId, html)}
                textColor={titleColor}
                fontSize={Math.round(36 * titleSizeMultiplier)}
                minHeight="1.4em"
              />
            ) : (
              <div
                className="font-light"
                style={{
                  color: titleColor,
                  fontSize: `clamp(1.5rem, ${6 * titleSizeMultiplier}vh, 8rem)`,
                  lineHeight: '1.2',
                }}
                dangerouslySetInnerHTML={{ __html: title || "" }}
              />
            )}
          </div>
          {logoImage && (
            <img
              src={logoImage}
              alt="Logo"
              className="max-h-16 object-contain ml-4 flex-shrink-0"
            />
          )}
        </div>
      )}

      {/* Tables Area */}
      <div
        className="flex-1 min-h-0 flex flex-col justify-center"
        style={{
          padding: isEditor ? '1rem' : '3vh 4vw',
          gap: isEditor ? '0.75rem' : '2.5vh',
        }}
      >
        <div className="w-full">
          {renderTable(table0, 0)}
        </div>
        {showSecondTable && (
          <div className="w-full">
            {renderTable(table1, 1)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
