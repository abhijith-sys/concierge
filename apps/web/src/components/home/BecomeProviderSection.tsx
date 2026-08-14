import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { SafeImage } from "../SafeImage";
import { Button } from "../ui";

const benefits = [
  "Create your profile",
  "Reach more customers",
  "Manage enquiries",
  "Grow your business",
];

export function BecomeProviderSection() {
  return (
    <section className="py-6 md:py-8">
      <div className="page-shell">
        <div className="overflow-hidden rounded-[1.75rem] bg-cream">
          <div className="grid items-center gap-6 p-5 md:grid-cols-[0.7fr_1.3fr] md:p-8 lg:grid-cols-[0.7fr_1.1fr_0.9fr]">
            <div className="relative min-h-44 overflow-hidden rounded-2xl md:min-h-52">
              <SafeImage
                src="/assets/aura-showroom.jpg"
                alt="A local professional ready to take on new work"
                width={640}
                height={640}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-navy md:text-3xl">Have a service to offer?</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">
                Join thousands of professionals and grow your business with Concierge. List your services, reach more
                customers and manage everything easily.
              </p>
            </div>
            <div>
              <ul className="grid gap-2.5">
                {benefits.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-bold text-navy">
                    <span className="grid size-6 place-items-center rounded-full bg-white text-gold-dark shadow-sm">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/list-business" className="mt-6 inline-flex">
                <Button className="px-6">
                  Become a provider <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
