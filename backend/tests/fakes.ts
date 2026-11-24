import { vi } from "vitest";

// Lažna baza: vsak test sam določi, kaj vrne posamezna poizvedba
export const fakePrisma = {
  zaposleni: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  stranka: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  projekt: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  dodelitev: {
    findUnique: vi.fn(),
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  ure: {
    create: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
};

// Lažen Supabase Auth (prijava in preverjanje žetona)
export const fakeSupabaseAuth = {
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
};
