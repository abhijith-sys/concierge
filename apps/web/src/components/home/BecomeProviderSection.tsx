import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { isProvider } from "../../lib/provider";
import { SafeImage } from "../SafeImage";
import { Button } from "../ui";

const benefits = [
  "Create your shop",
  "Reach more buyers",
  "Publish bulk & piece rates",
  "Grow your network",
];

export function BecomeProviderSection() {
  const { user, isLoading } = useAuth();
  const provider = isProvider(user);

  return (
    <section className="py-6 md:py-8">
      <div className="page-shell">
        <div className="overflow-hidden rounded-[1.75rem] bg-cream">
          <div className="grid items-center gap-6 p-5 md:grid-cols-[0.7fr_1.3fr] md:p-8 lg:grid-cols-[0.7fr_1.1fr_0.9fr]">
            <div className="relative min-h-44 overflow-hidden rounded-2xl md:min-h-52">
              <SafeImage
                src="/assets/listings/electrical-shop.jpg"
                alt="A local professional ready to take on new work"
                width={640}
                height={640}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-navy md:text-3xl">Sell to a network of buyers?</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">
                List your shop, publish a catalog with bulk and piece rates, and get discovered by businesses looking to connect.
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
              {isLoading || !user ? null : (
                <Link to="/provider" className="mt-6 inline-flex">
                  <Button className="px-6">
                    {provider ? "My Business" : "List your business"} <ArrowRight className="size-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
