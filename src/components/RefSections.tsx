import type { RefSection } from "@/lib/types";

/** Renders a reference sheet (travel / fueling / paces) as clean cards. */
export default function RefSections({ sections }: { sections: RefSection[] }) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <section key={i} className="card p-4">
          {section.heading && (
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/55 mb-3">
              {section.heading}
            </h2>
          )}
          <dl className="space-y-3">
            {section.items.map((item, j) => (
              <div key={j} className={item.sub ? "pl-4 border-l-2 border-black/10" : ""}>
                <dt className="font-semibold text-sm">{item.term}</dt>
                <dd className="text-sm text-foreground/70 mt-0.5">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
