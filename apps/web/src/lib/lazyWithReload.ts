import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "concierge:chunk-reload";

function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|error loading dynamically imported module/i.test(
    message,
  );
}

/**
 * Recovers once from stale hashed chunks after a deployment. A successful
 * import clears the marker, while a genuine runtime error is left for the
 * route error boundary to display.
 */
export function lazyWithReload<TModule, TProps extends object>(
  importer: () => Promise<TModule>,
  select: (module: TModule) => ComponentType<TProps>,
) {
  return lazy(async () => {
    try {
      const module = await importer();
      const component = select(module);
      if (typeof component !== "function") {
        throw new Error("Route module did not export a valid React component.");
      }
      sessionStorage.removeItem(RELOAD_KEY);
      return { default: component };
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, "1");
        window.location.reload();
        return new Promise<never>(() => undefined);
      }
      sessionStorage.removeItem(RELOAD_KEY);
      throw error;
    }
  });
}
