import { describe, expect, it } from "vitest";
import { storageKeyFromUrl, urlForStorageKey } from "../../src/modules/assets/assets.repository";

describe("asset URL helpers", () => {
  it("maps public upload URLs to storage keys", () => {
    expect(storageKeyFromUrl("/uploads/public/abc.jpg")).toBe("public/abc.jpg");
    expect(urlForStorageKey("public/abc.jpg", "public")).toBe("/uploads/public/abc.jpg");
  });

  it("maps private upload URLs to storage keys", () => {
    expect(storageKeyFromUrl("/api/uploads/private/secret.pdf")).toBe("private/secret.pdf");
    expect(urlForStorageKey("private/secret.pdf", "private")).toBe("/api/uploads/private/secret.pdf");
  });

  it("keeps design-static and absolute URLs as keys", () => {
    expect(storageKeyFromUrl("/assets/hero.jpg")).toBe("/assets/hero.jpg");
    expect(storageKeyFromUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
  });
});
