import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, PageState } from "./ui";

export class RouteErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, details: ErrorInfo) {
    console.error("[web] Unhandled render error", error, details);
  }

  render() {
    if (this.state.error) {
      const message = this.state.error.message || "Unknown error";
      const isChunkError =
        /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i.test(
          message,
        );
      return (
        <PageState
          title={isChunkError ? "This page needs a quick refresh" : "Concierge could not open this page"}
          description={
            isChunkError
              ? "The app was updated while this tab was open. Reload once to continue."
              : "Something went wrong while opening this page. Try another page or reload."
          }
          action={<Button onClick={() => window.location.reload()}>Reload page</Button>}
        />
      );
    }
    return this.props.children;
  }
}
