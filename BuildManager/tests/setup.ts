import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom ne pozna matchMedia, ki ga stranski meni uporablja za zaznavanje telefona
window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;

// Po vsakem testu se izrisana stran, shranjena prijava in lažni fetch pobrišejo
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
