import { Fragment } from "react";
import {
  TBD,
  UPDATED,
  race,
  outfit,
  stops,
  finish,
  rules,
  miles,
  type SpectatorImage,
  type SpectatorStop,
} from "@/data/spectator";

/**
 * Race Day Spectator Guide (/guide/race-day). Written for non-runners on a phone, outdoors,
 * on patchy service: big bold times, high-contrast text, and a compact at-a-glance stop
 * list that fits in one screenshot. All content comes from src/data/spectator.ts.
 */

const BE_THERE_MIN = 15;

/** "10:58 AM" → same clock string 15 minutes earlier ("10:43 AM"). */
function beBy(eta: string): string {
  const m = eta.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return eta;
  const ampm = m[3].toUpperCase();
  let h = Number(m[1]) % 12;
  if (ampm === "PM") h += 12;
  const total = (h * 60 + Number(m[2]) - BE_THERE_MIN + 24 * 60) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(total % 60).padStart(2, "0")} ${h24 < 12 ? "AM" : "PM"}`;
}

function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Renders **bold** spans inside plain strings from the data file. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-foreground">
            {p}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function Tbd() {
  return (
    <span className="inline-block rounded-md border-2 border-dashed border-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent">
      TBD — to be confirmed
    </span>
  );
}

/** A value that may still be the TBD sentinel. */
function Val({ value }: { value: string }) {
  return value === TBD ? <Tbd /> : <Rich text={value} />;
}

/** `tall` = portrait frame (full-length outfit photo); default is 4:3 for street shots. */
function ImageSlot({ image, tall = false }: { image: SpectatorImage; tall?: boolean }) {
  const aspect = tall ? "aspect-[3/4]" : "aspect-[4/3]";
  if (image.src) {
    return (
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element -- static photos, no optimizer config */}
        <img src={image.src} alt={image.label} className={`w-full ${aspect} object-cover rounded-xl border border-edge`} />
        <figcaption className="mt-1 text-xs text-foreground/70">{image.label}</figcaption>
      </figure>
    );
  }
  return (
    <div className={`${aspect} rounded-xl border-2 border-dashed border-edge bg-soft flex items-center justify-center p-2 text-center`}>
      <span className="text-xs font-medium text-foreground/60">
        Photo coming:
        <br />
        {image.label}
      </span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/70 mb-3">{children}</h2>;
}

/** Display label: "Stop 1".."Stop 3" for main stops, "Optional" for the optional one. */
function stopLabel(stop: SpectatorStop): string {
  if (stop.optional) return "Optional";
  return `Stop ${stops.filter((s) => !s.optional).indexOf(stop) + 1}`;
}

function StopBadge({ stop }: { stop: SpectatorStop }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        stop.optional ? "bg-soft text-foreground/80 border border-edge" : "bg-primary text-primary-contrast"
      }`}
    >
      {stopLabel(stop)}
    </span>
  );
}

function StopCard({ stop }: { stop: SpectatorStop }) {
  return (
    <section className="card p-4 space-y-3">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <StopBadge stop={stop} />
          <span className="text-sm font-semibold text-foreground/70">Mile ~{stop.mile}</span>
          {stop.optionalNote && (
            <span className="text-xs font-medium text-foreground/70">· {stop.optionalNote}</span>
          )}
        </div>
        <h3 className="mt-1.5 text-lg font-bold leading-snug">{stop.name}</h3>
        <p className="text-sm text-foreground/75">{stop.area}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-soft p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/70">My ETA</div>
          <div className="text-2xl font-bold tabular-nums">~{stop.eta}</div>
        </div>
        <div className="rounded-xl border-2 border-accent p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">Be in place by</div>
          <div className="text-2xl font-bold tabular-nums">{beBy(stop.eta)}</div>
        </div>
      </div>

      <dl className="space-y-2 text-[15px]">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Stand on</dt>
          <dd className="text-foreground/90">
            <Rich text={stop.side} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/70">Nearest subway</dt>
          <dd className="text-foreground/90">{stop.station}</dd>
        </div>
      </dl>

      {stop.notes.length > 0 && (
        <ul className="space-y-1.5 text-sm text-foreground/85 list-disc pl-5">
          {stop.notes.map((n, i) => (
            <li key={i}>
              <Rich text={n} />
            </li>
          ))}
        </ul>
      )}

      <a
        href={mapsUrl(stop.mapsQuery)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-contrast py-2.5 text-sm font-semibold"
      >
        📍 Open in Google Maps
      </a>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {stop.images.map((img, i) => (
          <ImageSlot key={i} image={img} />
        ))}
      </div>

      <div className="rounded-xl border-l-4 border-primary bg-soft p-3">
        <div className="text-xs font-bold uppercase tracking-wide text-primary">Next →</div>
        <p className="mt-0.5 text-[15px] text-foreground/90">
          <Rich text={stop.next} />
        </p>
      </div>
    </section>
  );
}

/** The screenshot-friendly summary: every stop, one row each. */
function AtAGlance() {
  return (
    <section className="card p-4">
      <SectionHeading>Stops at a glance</SectionHeading>
      <ol className="divide-y divide-edge">
        {stops.map((s) => (
          <li key={s.name} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <StopBadge stop={s} />
                <span className="text-xs font-semibold text-foreground/70">mi {s.mile}</span>
              </div>
              <div className="mt-1 font-bold leading-snug">{s.short}</div>
              <div className="text-xs text-foreground/80">
                <Rich text={s.side.replace(/\s*\(.*\)$/, "")} /> · {s.station}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-semibold text-accent">be there</div>
              <div className="text-lg font-bold tabular-nums leading-tight">{beBy(s.eta)}</div>
              <div className="text-xs text-foreground/70 tabular-nums">I pass ~{s.eta}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 pt-3 border-t border-edge text-xs text-foreground/80">
        Finish ~{finish.eta.replace("~", "")} · Bib <strong>{race.bib}</strong> · Live dot beats these times after mile 10
      </p>
    </section>
  );
}

/** Mile table rows with the stops slotted in at their fractional mile. */
function mileRows() {
  type Row =
    | { kind: "mile"; m: (typeof miles)[number] }
    | { kind: "stop"; s: SpectatorStop };
  const rows: Row[] = miles.map((m) => ({ kind: "mile", m }));
  for (const s of stops) {
    const at = rows.findIndex((r) => r.kind === "mile" && r.m.mile > s.mile);
    rows.splice(at === -1 ? rows.length : at, 0, { kind: "stop", s });
  }
  return rows;
}

export default function SpectatorGuide() {
  const mainStops = stops.filter((s) => !s.optional);
  const optionalStops = stops.filter((s) => s.optional);

  return (
    <div className="space-y-4">
      {/* 1. Header + warning */}
      <header className="rounded-2xl bg-gradient-to-br from-blue-800 via-blue-700 to-orange-600 dark:from-blue-950 dark:via-blue-900 dark:to-orange-900 text-white shadow-md p-4">
        <h2 className="text-xl font-bold leading-tight">{race.title}</h2>
        <p className="mt-1 text-sm font-medium text-white/90">
          {race.name} · {race.dateLabel}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/15 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/85">Bib</div>
            <div className="text-lg font-bold tabular-nums">{race.bib}</div>
          </div>
          <div className="rounded-xl bg-white/15 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/85">{race.wave}</div>
            <div className="text-lg font-bold tabular-nums">{race.start}</div>
          </div>
          <div className="rounded-xl bg-white/15 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-white/85">Start</div>
            <div className="text-lg font-bold">{race.corral.replace(/ start$/i, "")}</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/90">
          Planned finish {race.plannedFinish} (halfway {race.half}) · Updated {UPDATED}
        </p>
      </header>

      <section className="rounded-2xl border-2 border-accent bg-accent/10 p-4">
        <div className="text-sm font-bold uppercase tracking-wide text-accent">⚠️ Times are estimates</div>
        <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">{race.warning}</p>
        <div className="mt-2 text-sm text-foreground/90">
          <span className="font-semibold">App name in the App Store: </span>
          <Val value={race.appName} />
        </div>
      </section>

      {/* 2. How to spot me */}
      <section className="card p-4">
        <SectionHeading>How to spot me</SectionHeading>
        <div className="flex gap-4">
          <ul className="flex-1 space-y-1.5 text-[15px] font-medium text-foreground/90">
            {outfit.items.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="w-32 shrink-0">
            <ImageSlot image={outfit.photo} tall />
          </div>
        </div>
      </section>

      {/* 3. Recommended stops */}
      <AtAGlance />
      {mainStops.map((s) => (
        <StopCard key={s.name} stop={s} />
      ))}
      {optionalStops.map((s) => (
        <StopCard key={s.name} stop={s} />
      ))}

      {/* 4. After the finish */}
      <section className="card p-4 space-y-2">
        <SectionHeading>After the finish</SectionHeading>
        <div className="text-[15px] text-foreground/90">
          <span className="font-semibold">My estimated finish:</span>{" "}
          <span className="text-lg font-bold tabular-nums">{finish.eta}</span>
        </div>
        <p className="text-[15px] text-foreground/90">{finish.note}</p>
        <div className="rounded-xl border-2 border-primary p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-primary">Meeting spot</div>
          <div className="mt-1 text-[15px] font-semibold">
            <Val value={finish.meetingSpot} />
          </div>
        </div>
      </section>

      {/* 5. Rules for spectators */}
      <section className="card p-4">
        <SectionHeading>Rules for spectators</SectionHeading>
        <ul className="space-y-2 text-[15px] text-foreground/90 list-disc pl-5">
          {rules.items.map((r, i) => (
            <li key={i}>
              <Rich text={r} />
            </li>
          ))}
        </ul>
        <div className="mt-3 text-sm text-foreground/90">
          <span className="font-semibold">Race-week MTA service changes: </span>
          <Val value={rules.mtaChanges} />
        </div>
      </section>

      {/* 6. Full mile-by-mile ETAs */}
      <section className="card p-4">
        <SectionHeading>Mile-by-mile ETAs</SectionHeading>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-foreground/70">
                <th className="py-1.5 px-1 font-semibold">Mile</th>
                <th className="py-1.5 px-1 font-semibold">Area</th>
                <th className="py-1.5 px-1 font-semibold text-right">ETA</th>
              </tr>
            </thead>
            <tbody>
              {mileRows().map((r) =>
                r.kind === "stop" ? (
                  <tr key={`stop-${r.s.name}`} className="bg-accent/15 font-semibold">
                    <td className="py-2 px-1 tabular-nums rounded-l-lg">{r.s.mile}</td>
                    <td className="py-2 px-1">
                      ★ {stopLabel(r.s)} · {r.s.short}
                    </td>
                    <td className="py-2 px-1 text-right tabular-nums rounded-r-lg">{r.s.eta.replace(/\s*(AM|PM)$/i, "")}</td>
                  </tr>
                ) : (
                  <tr
                    key={r.m.label}
                    className={`border-t border-edge ${r.m.noSpectators ? "text-foreground/50" : "text-foreground/90"}`}
                  >
                    <td className="py-1.5 px-1 font-semibold tabular-nums">{r.m.label}</td>
                    <td className="py-1.5 px-1">{r.m.area}</td>
                    <td className="py-1.5 px-1 text-right tabular-nums">{r.m.eta}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
