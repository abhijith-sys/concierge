import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { saveAuthIntent } from "../lib/auth-intent";
import { twMerge } from "tailwind-merge";

export function WishlistButton({
  listingId,
  className,
}: {
  listingId?: string | null;
  className?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const wishlist = useQuery({
    queryKey: ["wishlist"],
    queryFn: api.wishlist,
    enabled: Boolean(user),
  });
  const saved = Boolean(listingId && wishlist.data?.some((item) => item.listingId === listingId));

  const toggle = useMutation({
    mutationFn: async () => {
      if (!listingId) return;
      if (saved) await api.removeWishlist(listingId);
      else await api.addWishlist(listingId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  if (!listingId) return null;

  return (
    <button
      type="button"
      className={twMerge(
        "inline-flex size-10 items-center justify-center rounded-full border border-white/40 bg-white/90 text-black shadow-sm backdrop-blur transition hover:bg-white",
        saved && "border-red-200 bg-red-50 text-red-600",
        className,
      )}
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      disabled={toggle.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!user) {
          saveAuthIntent({ type: "wishlist", listingId });
          navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
          return;
        }
        toggle.mutate();
      }}
    >
      <Heart className={twMerge("size-4", saved && "fill-current")} />
    </button>
  );
}
