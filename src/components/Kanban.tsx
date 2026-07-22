import { useRef, useState, type ReactNode } from 'react';
import { GripVertical, MoveRight } from 'lucide-react';
import { withAlpha } from './primitives';

export interface KanbanColumn {
  key: string;
  label: string;
  color: string;
}

export interface KanbanCard {
  id: string;
  column: string;
  render: ReactNode;
}

/**
 * A board whose columns are a status field.
 *
 * Dragging is HTML5 drag-and-drop, which mice and trackpads handle natively but
 * touch screens do not fire at all. Every card therefore also carries a "move"
 * menu — that is the only path on a phone, and it doubles as the keyboard path.
 */
export function Kanban({
  columns,
  cards,
  onMove,
  disabled,
  emptyLabel,
  moveLabel,
}: {
  columns: KanbanColumn[];
  cards: KanbanCard[];
  onMove: (id: string, toColumn: string) => void;
  disabled?: boolean;
  emptyLabel: string;
  moveLabel: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // Nested dragenter/dragleave fire per child; count them to know when we
  // have really left the column.
  const depth = useRef(0);

  const endDrag = () => {
    setDragId(null);
    setOverColumn(null);
    depth.current = 0;
  };

  const drop = (columnKey: string) => {
    if (dragId) {
      const card = cards.find((c) => c.id === dragId);
      if (card && card.column !== columnKey) onMove(dragId, columnKey);
    }
    endDrag();
  };

  return (
    // Bleeds to the screen edge so columns can scroll; the inset must match the
    // main container's px-3 or the page itself overflows sideways.
    <div className="-mx-3 overflow-x-auto px-3 pb-2 lg:mx-0 lg:px-0">
      <div className="flex min-w-max gap-3.5 lg:grid lg:min-w-0 lg:grid-cols-3 lg:gap-4">
        {columns.map((col) => {
          const items = cards.filter((c) => c.column === col.key);
          const isOver = overColumn === col.key && dragId !== null;
          return (
            <section
              key={col.key}
              onDragEnter={(e) => {
                e.preventDefault();
                depth.current += 1;
                setOverColumn(col.key);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => {
                depth.current -= 1;
                if (depth.current <= 0) {
                  depth.current = 0;
                  setOverColumn(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                drop(col.key);
              }}
              className={`w-[78vw] shrink-0 rounded-2xl border-2 border-dashed p-2.5 transition-colors
                          sm:w-[300px] lg:w-auto ${
                            isOver ? 'bg-white' : 'border-transparent bg-surface-muted/70'
                          }`}
              style={isOver ? { borderColor: col.color, backgroundColor: withAlpha(col.color, 0.06) } : undefined}
            >
              <header className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-[13.5px] font-bold text-ink-900">{col.label}</h3>
                <span
                  className="ms-auto rounded-full px-2 py-0.5 text-[11.5px] font-bold tnum"
                  style={{ backgroundColor: withAlpha(col.color, 0.12), color: col.color }}
                >
                  {items.length}
                </span>
              </header>

              <div className="space-y-2.5">
                {items.map((card) => (
                  <article
                    key={card.id}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      setDragId(card.id);
                      e.dataTransfer.effectAllowed = 'move';
                      // Firefox refuses to start a drag without payload.
                      e.dataTransfer.setData('text/plain', card.id);
                    }}
                    onDragEnd={endDrag}
                    className={`group relative rounded-xl border border-slate-100 bg-white p-3 shadow-soft
                                transition ${dragId === card.id ? 'opacity-40' : 'hover:shadow-card'}
                                ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    {card.render}

                    {!disabled && (
                      <div className="absolute end-1.5 top-1.5 flex items-center gap-0.5">
                        <span
                          className="hidden text-ink-400/60 lg:block lg:opacity-0 lg:transition
                                     lg:group-hover:opacity-100"
                          aria-hidden="true"
                        >
                          <GripVertical size={15} />
                        </span>
                        <button
                          type="button"
                          onClick={() => setMenuFor(menuFor === card.id ? null : card.id)}
                          aria-label={moveLabel}
                          aria-expanded={menuFor === card.id}
                          className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-ink-400
                                     hover:bg-surface-muted hover:text-brand-600"
                        >
                          <MoveRight size={15} />
                        </button>
                      </div>
                    )}

                    {menuFor === card.id && (
                      <div
                        className="absolute end-1.5 top-10 z-20 w-44 overflow-hidden rounded-xl border
                                   border-slate-100 bg-white shadow-lift animate-slide-up"
                        role="menu"
                      >
                        <p className="border-b border-slate-100 px-3 py-2 text-[11px] font-bold
                                      uppercase tracking-wider text-ink-400">
                          {moveLabel}
                        </p>
                        {columns
                          .filter((c) => c.key !== card.column)
                          .map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onMove(card.id, c.key);
                                setMenuFor(null);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-start text-[13px]
                                         font-semibold text-ink-700 hover:bg-surface-muted"
                            >
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </article>
                ))}

                {!items.length && (
                  <p className="rounded-xl border border-dashed border-slate-200 py-7 text-center
                                text-[12.5px] text-ink-400">
                    {emptyLabel}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
