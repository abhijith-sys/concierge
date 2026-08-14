import { ClipboardList, Search, Send } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Search",
    copy: "Find the right service or professional for your need.",
    Icon: Search,
  },
  {
    n: "02",
    title: "Explore",
    copy: "Compare providers, check reviews and ratings.",
    Icon: ClipboardList,
  },
  {
    n: "03",
    title: "Connect",
    copy: "Contact, book or request services with confidence.",
    Icon: Send,
  },
];

export function HowItWorks() {
  return (
    <section className="py-8 md:py-10">
      <div className="page-shell">
        <p className="label-caps text-center text-gold-dark">How it works</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map((step) => (
            <div key={step.n} className="how-step relative text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full border border-line bg-white text-navy shadow-sm">
                <step.Icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-bold tracking-[0.14em] text-gold-dark">{step.n}</p>
              <h3 className="mt-1 text-base font-extrabold text-navy">{step.title}</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-ink-soft">{step.copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
