import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useLocation } from "react-router-dom";
import { EmptyList } from "../components/EmptyList";
import { ListingCard } from "../components/ListingCard";
import { Button, PageState } from "../components/ui";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";

export function Wishlist() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const wishlist = useQuery({
    queryKey: ["wishlist"],
    queryFn: api.wishlist,
    enabled: Boolean(user),
  });

  if (isLoading) return <PageState title="Loading wishlist" loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <section className="page-shell py-14 md:py-20">
      <p className="label-caps text-gold-dark">Saved for later</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy">Wishlist</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft">
        Keep the businesses you want to contact. Nothing here is public.
      </p>

      {wishlist.isLoading ? (
        <PageState title="Loading saved listings" loading />
      ) : wishlist.isError ? (
        <PageState
          title="Wishlist unavailable"
          description="Try again in a moment."
          action={<Button onClick={() => void wishlist.refetch()}>Retry</Button>}
        />
      ) : !wishlist.data?.length ? (
        <EmptyList
          title="No saved listings yet"
          description="Browse the directory and tap the heart to save a business."
          action={
            <Link to="/listings">
              <Button>Explore</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.data.map((item) =>
            item.listing ? <ListingCard key={item.id} listing={item.listing} /> : null,
          )}
        </div>
      )}
    </section>
  );
}
