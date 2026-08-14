import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui";

export function ConciergeEliteSection() {
  return (
    <section className="py-6 md:pb-10">
      <div className="page-shell">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[1.75rem] bg-navy px-6 py-7 text-white md:flex-row md:items-center md:px-10 md:py-8">
          <div className="max-w-xl">
            <p className="label-caps text-gold-light">The exceptional, on demand</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Concierge Elite</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Priority introductions, curated providers and personalized assistance for important projects.
            </p>
          </div>
          <Link to="/register" className="shrink-0">
            <Button variant="gold">
              Explore Concierge Elite <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
