import { Link, useLocation } from "react-router-dom";
import { Button, PageState } from "../components/ui";

const pages: Record<string, { title: string; eyebrow: string; body: string }> = {
  about: {
    eyebrow: "Company",
    title: "About us",
    body: "Concierge is a discovery platform for verified businesses and skilled professionals. We help people find considered partners for home, business, and everyday needs — and we help providers reach customers who are already looking.",
  },
  careers: {
    eyebrow: "Company",
    title: "Careers",
    body: "We are building a trusted marketplace for professional services. If you care about quality, local discovery, and thoughtful product work, we would like to hear from you.",
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms & Conditions",
    body: "By using Concierge you agree to browse, save, and contact providers in good faith. Listings are provided by independent businesses. Concierge does not guarantee availability, pricing, or outcomes of any engagement.",
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    body: "We collect the information needed to run your account, wishlist, and provider profile. Guest browsing does not require an account. Location is used only when you choose to search nearby. We do not sell personal data.",
  },
  contact: {
    eyebrow: "Support",
    title: "Contact us",
    body: "For help with an account, listing, or provider profile, sign in and use My account. For partnership or press enquiries, reach us through your Concierge account email once registered.",
  },
};

export function Content() {
  const page = useLocation().pathname.replace(/^\//, "");
  const copy = pages[page];

  if (!copy) {
    return (
      <PageState
        title="Page not found"
        description="The page you requested does not exist."
        action={
          <Link to="/">
            <Button>Back home</Button>
          </Link>
        }
      />
    );
  }

  return (
    <section className="page-shell max-w-3xl py-14 md:py-20">
      <p className="label-caps text-gold-dark">{copy.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">{copy.title}</h1>
      <p className="mt-5 text-sm leading-7 text-ink-soft md:text-base">{copy.body}</p>
    </section>
  );
}
