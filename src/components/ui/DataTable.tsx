import React, { useState } from 'react';
import { AlignJustify, AlignLeft } from 'lucide-react';

export type TableDensity = 'compact' | 'comfortable';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  mono?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  defaultDensity?: TableDensity;
  showDensityToggle?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  defaultDensity = 'comfortable',
  showDensityToggle = true,
  onRowClick,
  emptyMessage = 'No records match current parameters.',
  className = '',
}: DataTableProps<T>) {
  const [density, setDensity] = useState<TableDensity>(defaultDensity);

  const paddingY = density === 'compact' ? 'py-2' : 'py-3.5';

  return (
    <div className={`w-full flex flex-col ${className}`}>
      {showDensityToggle && (
        <div className="flex items-center justify-between pb-3 text-[12px] text-muted">
          <span className="font-mono text-[12px] uppercase tracking-wider">
            Showing {data.length} records
          </span>
          <div className="flex items-center gap-1 bg-surface-2 p-0.5 rounded-[6px] border border-hairline">
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`flex items-center gap-1 px-2 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                density === 'compact'
                  ? 'bg-surface text-ink font-semibold shadow-none'
                  : 'text-muted hover:text-ink'
              }`}
              title="Compact rows"
            >
              <AlignJustify className="w-3 h-3" />
              <span>Compact</span>
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`flex items-center gap-1 px-2 py-1 rounded-[4px] font-mono text-[11px] transition-colors cursor-pointer ${
                density === 'comfortable'
                  ? 'bg-surface text-ink font-semibold shadow-none'
                  : 'text-muted hover:text-ink'
              }`}
              title="Comfortable rows"
            >
              <AlignLeft className="w-3 h-3" />
              <span>Standard</span>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-[12px] border border-hairline bg-surface">
        <table className="w-full text-left border-collapse">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-surface-2 border-b border-hairline z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-4 py-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted select-none ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-hairline">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[13px] text-muted italic"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors bg-surface hover:bg-surface-2/70 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 ${paddingY} text-[13px] text-ink ${
                        col.mono ? 'font-mono tabular-nums' : ''
                      } ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
