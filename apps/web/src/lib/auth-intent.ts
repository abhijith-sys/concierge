const KEY = "concierge_auth_intent";

export type AuthIntent = {
  type: "wishlist";
  listingId: string;
};

export function saveAuthIntent(intent: AuthIntent) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    // Ignore private-mode storage failures; the user can retry after login.
  }
}

export function consumeAuthIntent(): AuthIntent | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as AuthIntent;
    if (parsed?.type === "wishlist" && typeof parsed.listingId === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}
