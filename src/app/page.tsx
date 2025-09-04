'use client';

import { useEffect, useMemo, useState } from 'react';
import { addMonths, format, startOfMonth, startOfWeek, addDays, isSameMonth } from 'date-fns';

type DayRow = { id: number; dateStr: string; who?: string | null; lesson?: string | null };

function toISO(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

export default function Page() {
  const [cursor, setCursor] = useState(() => new Date());
  const [data, setData] = useState<Record<string, DayRow>>({});
  const [selected, setSelected] = useState<string>(() => toISO(new Date()));
  const selectedRow = data[selected];

  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 }); // Sunday
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(start, i));
    return { days, monthLabel: format(cursor, 'MMMM yyyy'), rangeStart: start, rangeEnd: addDays(start, 41) };
  }, [cursor]);

  useEffect(() => {
    const start = toISO(grid.rangeStart);
    const end = toISO(grid.rangeEnd);
    fetch(`/api/day?start=${start}&end=${end}`)
      .then(r => r.json())
      .then((rows: DayRow[]) => {
        const next: Record<string, DayRow> = { ...data };
        for (const r of rows) next[r.dateStr] = r;
        setData(next);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.rangeStart.getTime(), grid.rangeEnd.getTime()]);

  function onSave() {
    const who = (document.getElementById('who') as HTMLInputElement)?.value ?? '';
    const lesson = (document.getElementById('lesson') as HTMLTextAreaElement)?.value ?? '';
    fetch('/api/day', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selected, who, lesson }),
    })
      .then(r => r.json())
      .then((row: DayRow) => setData(prev => ({ ...prev, [row.dateStr]: row })))
      .catch(console.error);
  }

  function sendToSlack(dateStr: string) {
    fetch(`/api/slack?date=${encodeURIComponent(dateStr)}`)
      .then(r => r.json())
      .then(res => {
        const ok = res?.ok;
        alert(ok ? `Sent ${dateStr} to Slack ✅` : `Slack error: ${res?.error || 'unknown'}`);
      })
      .catch(e => alert(`Slack error: ${String(e)}`));
  }

  return (
    <main className="wrap">
      <header className="top">
        <button onClick={() => setCursor(addMonths(cursor, -1))}>◀</button>
        <h1>{grid.monthLabel}</h1>
        <button onClick={() => setCursor(addMonths(cursor, 1))}>▶</button>
      </header>

      <section className="cal">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="dow">{d}</div>
        ))}
        {grid.days.map((d, i) => {
          const iso = toISO(d);
          const inMonth = isSameMonth(d, cursor);
          const row = data[iso];
          const has = !!(row?.who || row?.lesson);
          const isSel = iso === selected;
          return (
            <button
              key={i}
              className={["cell", inMonth ? '' : 'dim', has ? 'has' : '', isSel ? 'sel' : ''].join(' ')}
              onClick={() => setSelected(iso)}
              title={has ? `${row?.who || ''} — ${row?.lesson || ''}` : ''}
            >
              <div className="date">{format(d, 'd')}</div>
              {has && <div className="dot" />}
            </button>
          );
        })}
      </section>

      <aside className="editor">
        <h2>{selected}</h2>
        <label>
          <span>Who</span>
          <input id="who" defaultValue={selectedRow?.who ?? ''} placeholder="Name(s)" />
        </label>
        <label>
          <span>Lesson</span>
          <textarea id="lesson" defaultValue={selectedRow?.lesson ?? ''} placeholder="Topic / notes" rows={5} />
        </label>
        <div className="actions">
          <button onClick={onSave}>Save</button>
          <button className="slack" onClick={() => sendToSlack(selected)}>Send to Slack</button>
        </div>
      </aside>

      <style jsx global>{`
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
        .wrap { max-width: 1000px; margin: 32px auto; padding: 0 16px; }
        .top { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .top h1 { margin: 0; font-size: 22px; }
        .top button { padding: 6px 10px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer; }
        .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-top: 16px; }
        .dow { font-weight: 600; text-align: center; padding: 6px 0; color: #555; }
        .cell { position: relative; height: 90px; border: 1px solid #eee; border-radius: 10px; background: #fff; cursor: pointer; text-align: left; padding: 8px; }
        .cell.dim { background: #fafafa; color: #aaa; }
        .cell.has { border-color: #d1e7ff; }
        .cell.sel { outline: 3px solid #8cc5ff; }
        .cell .date { position: absolute; top: 6px; right: 8px; font-size: 12px; color: #666; }
        .cell .dot { position: absolute; left: 8px; bottom: 8px; width: 8px; height: 8px; border-radius: 50%; background: #1677ff; }
        .editor { margin-top: 18px; border: 1px solid #eee; border-radius: 12px; padding: 16px; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
        .editor h2 { margin-top: 0; font-size: 18px; }
        .editor label { display: grid; grid-template-columns: 80px 1fr; align-items: center; gap: 8px; margin: 8px 0; }
        .editor input, .editor textarea { width: 100%; padding: 8px 10px; border: 1px solid #ddd; border-radius: 10px; font: inherit; }
        .actions { display: flex; gap: 8px; justify-content: flex-end; }
        .actions button { padding: 8px 12px; border-radius: 10px; border: 1px solid #ddd; background: #fff; cursor: pointer; }
        .actions .slack { background: #f4f9ff; border-color: #b7dafd; }
      `}</style>
    </main>
  );
}
