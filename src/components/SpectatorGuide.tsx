import { Fragment } from "react";
import FoldControls from "@/components/FoldControls";
import {
  TBD,
  UPDATED,
  race,
  hero,
  tracking,
  outfit,
  stops,
  finish,
  miles,
  type SpectatorImage,
  type SpectatorStop,
} from "@/data/spectator";

/**
 * Race Day Spectator Guide (/guide/race-day). Written for non-runners on a phone, outdoors,
 * on patchy service: big bold times, high-contrast text, and a compact at-a-glance stop
 * list that fits in one screenshot. All content comes from src/data/spectator.ts.
 * Sections are collapsible <details> (Fold); with the stop rows closed, "Where to cheer"
 * is that one-screenshot summary. Look adapted from a friend's mock-up (hero, bib, rows).
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

/** Display label: "Stop 1".."Stop 3" for main stops, "Optional" for the optional one. */
function stopLabel(stop: SpectatorStop): string {
  if (stop.optional) return "Optional";
  return `Stop ${stops.filter((s) => !s.optional).indexOf(stop) + 1}`;
}

/** Round chevron for collapsible rows. `turn` is the group-open rotate class of the owning <details>. */
function Chevron({ turn }: { turn: string }) {
  return (
    <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-foreground/70">
      <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-current stroke-[2.3] transition-transform ${turn}`}>
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/**
 * A collapsible section card (native <details>, so it works with no JS). `data-rd-fold`
 * hooks it up to the Expand all / Collapse all control (FoldControls).
 */
function Fold({
  title,
  open = false,
  accent = false,
  id,
  bodyClassName = "p-4",
  children,
}: {
  title: string;
  open?: boolean;
  accent?: boolean;
  id?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      id={id}
      open={open}
      data-rd-fold
      className={`group/fold scroll-mt-16 overflow-hidden ${accent ? "rounded-2xl border-2 border-accent bg-card" : "card"}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 active:bg-soft [&::-webkit-details-marker]:hidden">
        <h2 className={`text-lg font-bold tracking-tight ${accent ? "text-orange-700 dark:text-accent" : ""}`}>{title}</h2>
        <Chevron turn="group-open/fold:rotate-180" />
      </summary>
      <div className={`border-t ${accent ? "border-accent/30" : "border-edge"} ${bodyClassName}`}>{children}</div>
    </details>
  );
}

/** Badge color + line icon per stop, in course order (Brooklyn bridge, Manhattan towers, finish flag). */
const STOP_STYLE = [
  { color: "#265fce", icon: "M4 30h32M9 30V13h5v17M26 30V13h5v17M11 16c5 5 13 5 18 0M4 34h32" },
  { color: "#fa629d", icon: "M4 32h32M7 32V17h8v15M15 32V8h11v24M26 32V15h8v17M19 13h3m-3 6h3m-3 6h3" },
  { color: "#ff711f", icon: "M9 35V6m1 2h23l-4 7 4 7H10M10 15h19M17 8v7m7 0v7M9 35h15" },
];

/** Course map with the cartoon runner standing on the spot (`pin` = % of the image box). */
function StopMap({ image }: { image: SpectatorImage }) {
  if (!image.src) return <ImageSlot image={image} />;
  const pin = image.pin;
  return (
    <figure>
      <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl border border-edge">
        {/* eslint-disable-next-line @next/next/no-img-element -- static map screenshot, natural aspect */}
        <img src={image.src} alt={image.label} loading="lazy" className="block max-w-full h-auto max-h-72" />
        {pin && (
          /* eslint-disable-next-line @next/next/no-img-element -- small decorative sprite */
          <img
            src={hero.pin}
            alt=""
            loading="lazy"
            className="pointer-events-none absolute w-[46px] h-auto"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: `translate(-50%, -95%)${pin.flip ? " scaleX(-1)" : ""}`,
              filter: "drop-shadow(0 0 3px #fff) drop-shadow(0 2px 3px #0003)",
            }}
          />
        )}
      </div>
      <figcaption className="mt-1 text-xs text-foreground/70">{image.label}</figcaption>
    </figure>
  );
}

/** One stop: the closed row is the at-a-glance summary (each fact once); open adds tips, map and next steps. */
function StopRow({ stop, index }: { stop: SpectatorStop; index: number }) {
  const style = STOP_STYLE[index % STOP_STYLE.length];
  return (
    <details open data-rd-fold className="group/stop border-t border-edge first:border-t-0">
      <summary className="grid cursor-pointer list-none grid-cols-[40px_minmax(0,1fr)_32px] gap-x-3 px-4 py-4 active:bg-soft [&::-webkit-details-marker]:hidden">
        <span
          role="img"
          aria-label={`${stopLabel(stop)}, ${stop.area}`}
          className="relative row-span-2 grid h-10 w-10 place-items-center rounded-[11px] shadow-[inset_0_1px_0_#ffffff55,0_5px_11px_#0003]"
          style={{ background: style.color }}
        >
          <svg viewBox="0 0 40 40" aria-hidden="true" className="h-6 w-6 fill-none stroke-white stroke-[2.4]">
            <path d={style.icon} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-white bg-[#071b3d] text-[10px] font-black text-white"
          >
            {stop.optional ? "+" : index + 1}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-[0.07em] text-foreground/70">
            Mile {stop.mile} · {stop.area}
          </span>
          <span className="mt-1 block text-lg font-bold leading-snug tracking-tight">{stop.name}</span>
          {stop.optionalNote && <span className="block text-[13px] text-foreground/80">{stop.optionalNote}</span>}
          <span className="mt-1 block text-sm text-foreground/85">
            Stand on <Rich text={stop.side} />
          </span>
          <span className="block text-sm text-foreground/85">
            Subway: <span className="font-semibold text-foreground">{stop.station}</span>
          </span>
        </span>
        <Chevron turn="group-open/stop:rotate-180" />
        <TimePair
          times={[
            { label: "Be there by", value: beBy(stop.eta), tone: "text-orange-700 dark:text-accent" },
            { label: "I pass", value: `~${stop.eta}`, tone: "text-primary" },
          ]}
        />
      </summary>

      {/* Where, side, subway and times are all in the row above; open adds only what's new. */}
      <div className="space-y-3 bg-soft px-4 pt-3 pb-4">
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
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-contrast py-2.5 text-sm font-semibold"
        >
          📍 Open in Google Maps
        </a>

        {stop.images.map((img, i) => (
          <StopMap key={i} image={img} />
        ))}

        <div className="rounded-xl border-l-4 border-primary bg-card p-3">
          <div className="text-xs font-bold uppercase tracking-wide text-primary">Next →</div>
          <p className="mt-0.5 text-[15px] text-foreground/90">
            <Rich text={stop.next} />
          </p>
        </div>
      </div>
    </details>
  );
}

/** Two side-by-side times under a row's title, each a colored label over a bold time. */
function TimePair({ times }: { times: { label: string; value: string; tone: string }[] }) {
  return (
    <span className="col-span-2 col-start-2 mt-2 grid grid-cols-2 gap-3 border-t border-edge pt-2">
      {times.map((t) => (
        <span key={t.label} className="min-w-0">
          <span className={`block text-xs font-bold uppercase tracking-[0.07em] ${t.tone}`}>{t.label}</span>
          <strong className="block text-lg leading-tight tabular-nums">{t.value}</strong>
        </span>
      ))}
    </span>
  );
}

/** Last row of Where to cheer: the post-race meetup (the whole "after the finish" story), so the closed rows cover the day. */
function MeetupRow() {
  return (
    <details open data-rd-fold className="group/meet border-t border-edge">
      <summary className="grid cursor-pointer list-none grid-cols-[40px_minmax(0,1fr)_32px] gap-x-3 px-4 py-4 active:bg-soft [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="row-span-2 grid h-10 w-10 place-items-center rounded-[11px] bg-success text-xl">
          🤝
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-bold uppercase tracking-[0.07em] text-foreground/70">
            After the finish · Meet up
          </span>
          <span className="mt-1 block text-xl font-bold leading-tight tracking-tight">
            <Val value={finish.meetingShort} />
          </span>
          <span className="mt-1 block text-sm text-foreground/85">{finish.note}</span>
        </span>
        <Chevron turn="group-open/meet:rotate-180" />
        <TimePair
          times={[
            { label: "Meet at", value: finish.meetingTime, tone: "text-emerald-700 dark:text-success" },
            { label: "I finish", value: finish.eta, tone: "text-primary" },
          ]}
        />
      </summary>

      <div className="space-y-3 bg-soft px-4 pt-3 pb-4">
        {finish.meetingImage && <StopMap image={finish.meetingImage} />}
        {finish.meetingMapsQuery && (
          <a
            href={mapsUrl(finish.meetingMapsQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-contrast py-2.5 text-sm font-semibold"
          >
            📍 Open in Google Maps
          </a>
        )}
      </div>
    </details>
  );
}

/**
 * The outfit recreated as one flat lay (hat → tee → shorts → shoes): transparent cutouts
 * stacked at true-to-life relative sizes, the tee's hem layered over the shorts' waistband,
 * each label on the left level with its piece. Earlier pieces paint on top (z-index).
 * Always on a white panel (both themes): the product shots were lit on white, so their
 * soft floor shadows read naturally there instead of as smudges on the dark card.
 */
function OutfitList() {
  const pieces = outfit.pieces.filter((p) => p.src);
  return (
    <ul className="min-w-0 flex-1 rounded-2xl bg-white p-3" aria-label="Outfit">
      {pieces.map((p, i) => (
        <li
          key={p.label}
          className="relative flex items-center gap-3"
          style={{ marginTop: i === 0 ? 0 : -p.tuck, zIndex: pieces.length - i }}
        >
          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[#1f2937]">{p.label}</span>
          {/* Fixed-width column: the tee is 140px and every piece's `width` is % of that. */}
          <span className="w-[140px] shrink-0 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- static transparent cutout */}
            <img src={p.src!} alt="" loading="lazy" className="h-auto" style={{ width: `${p.width}%` }} />
          </span>
        </li>
      ))}
    </ul>
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

/** Title on a theme-aware sky, with the cartoon runner on an animated road (styles: .rd-* in globals.css). */
function RaceHero() {
  return (
    <header className="rd-hero relative overflow-hidden rounded-2xl shadow-md">
      <span className="rd-skyline" aria-hidden="true" />
      <span className="rd-road" aria-hidden="true" />
      <span className="rd-sign" aria-hidden="true">
        NYC
      </span>
      <div className="relative sm:flex sm:items-end sm:justify-between">
        <div className="px-5 pt-6 sm:pt-8 sm:pb-16 sm:pl-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--rd-eyebrow)]">
            Race day · {race.dateLabel}
          </p>
          <h1 className="mt-2 text-[34px] sm:text-5xl font-extrabold leading-[1.05] tracking-tight">
            {hero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-2 text-xs font-medium text-[var(--rd-muted)]">Spectator guide · Updated {UPDATED}</p>
        </div>
        <div className="flex justify-center pt-3 sm:pt-6 sm:pr-12">
          <picture>
            <source media="(prefers-reduced-motion: reduce)" srcSet={hero.runnerStill} />
            <img src={hero.runner.src ?? hero.runnerStill} alt={hero.runner.label} className="rd-runner" width={288} height={384} />
          </picture>
        </div>
      </div>
    </header>
  );
}

/** Start details styled as the real race bib: always paper-white, like the bib itself. */
function RaceBib() {
  return (
    <section
      aria-label="My race bib and start details"
      className="overflow-hidden rounded-xl border-[6px] border-white bg-[#f5f7fb] text-[#111c36] shadow-md ring-1 ring-black/5"
    >
      <div className="flex items-center gap-2 border-b-2 border-[#e6eaf1] px-3 pt-2.5 pb-2">
        <span className="rd-bib-mark shrink-0" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="min-w-0 text-[11px] font-black uppercase leading-tight tracking-[0.06em]">
          {race.event}
          <span className="mt-0.5 block font-semibold normal-case tracking-normal text-[#5b6780]">{race.dateLabel}</span>
        </div>
        <span className="ml-auto shrink-0 rounded bg-[#fce2ec] px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#aa245e]">
          {race.wave}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-2 px-4 pt-2.5 pb-3">
        <span className="col-span-2 text-xs font-black uppercase tracking-[0.12em]">{race.fullName}</span>
        <strong className="text-[clamp(56px,16vw,104px)] font-black leading-none tracking-[-0.06em] tabular-nums">
          {race.bib}
        </strong>
        <span className="flex flex-col gap-1.5 pb-1 text-right">
          <b className="whitespace-nowrap rounded-sm bg-[#f6a0bd] px-2 py-1 text-xs uppercase tracking-[0.05em] text-[#4f1332]">
            {race.corral}
          </b>
          <b className="whitespace-nowrap rounded-sm bg-[#e5e9ef] px-2 py-1 text-xs tracking-[0.05em] text-[#17223b]">
            {race.start}
          </b>
        </span>
      </div>
      <div className="flex justify-between gap-2 bg-[#102d65] px-4 py-2 text-xs text-[#edf5ff]">
        <span>
          Planned finish <strong className="text-white tabular-nums">{race.plannedFinish}</strong>
        </span>
        <span>
          Halfway <strong className="text-white tabular-nums">{race.half}</strong>
        </span>
      </div>
    </section>
  );
}

export default function SpectatorGuide() {
  const mainStops = stops.filter((s) => !s.optional);
  const optionalStops = stops.filter((s) => s.optional);

  return (
    <div className="space-y-4">
      {/* 1. Hero + race bib */}
      <RaceHero />
      <RaceBib />

      <div className="flex justify-end">
        <FoldControls />
      </div>

      {/* 2. How to track me (open by default) */}
      <Fold title={`📍 ${tracking.title}`} open accent>
        <ol className="space-y-4">
          {tracking.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="shrink-0 h-7 w-7 grid place-items-center rounded-full bg-accent text-white text-sm font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-[15px] leading-relaxed text-foreground/90">
                  <Rich text={step.text} />
                </p>
                {step.image?.src && (
                  /* eslint-disable-next-line @next/next/no-img-element -- static screenshot, natural aspect */
                  <img
                    src={step.image.src}
                    alt={step.image.label}
                    className="w-full max-w-xs rounded-xl border border-edge"
                  />
                )}
                {"link" in step && step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 max-w-xs items-center justify-center gap-2 rounded-xl bg-primary text-primary-contrast py-2.5 text-sm font-semibold"
                  >
                    {step.link.label} ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 pt-3 border-t border-accent/30 text-sm leading-relaxed text-foreground/85">
          <span className="font-semibold">⚠️ Times are estimates. </span>
          <Rich text={tracking.estimateNote} />
        </p>
      </Fold>

      {/* 3. Where to cheer (open by default): collapse the stop rows for a one-screenshot summary */}
      <Fold title="Where to cheer" open bodyClassName="">
        {mainStops.map((s, i) => (
          <StopRow key={s.name} stop={s} index={i} />
        ))}
        {optionalStops.map((s, i) => (
          <StopRow key={s.name} stop={s} index={mainStops.length + i} />
        ))}
        <MeetupRow />
      </Fold>

      {/* 4. How to spot me */}
      <Fold title="How to spot me">
        <div className="flex gap-4 items-start">
          <OutfitList />
          {outfit.showPhoto && (
            <div className="w-36 sm:w-44 shrink-0">
              {outfit.photo.src ? (
                /* eslint-disable-next-line @next/next/no-img-element -- static photo, natural aspect */
                <img src={outfit.photo.src} alt={outfit.photo.label} className="w-full h-auto rounded-xl border border-edge" />
              ) : (
                <ImageSlot image={outfit.photo} tall />
              )}
            </div>
          )}
        </div>
      </Fold>

      {/* 5. Full mile-by-mile ETAs */}
      <Fold title="Mile-by-mile ETAs">
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
      </Fold>
    </div>
  );
}
