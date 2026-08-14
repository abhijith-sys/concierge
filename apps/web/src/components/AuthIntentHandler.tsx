import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { api } from "../lib/api";
import { consumeAuthIntent } from "../lib/auth-intent";

export function AuthIntentHandler() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const intent = consumeAuthIntent();
    if (!intent) return;
    if (intent.type === "wishlist") {
      void api
        .addWishlist(intent.listingId)
        .then(() => queryClient.invalidateQueries({ queryKey: ["wishlist"] }))
        .catch(() => {
          // Listing may be pending or removed; the user can retry from the profile.
        });
    }
  }, [user, queryClient]);

  return null;
}
