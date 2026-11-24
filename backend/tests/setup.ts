import { beforeEach, vi } from "vitest";

// Testi ne uporabljajo prave baze in Supabase, ampak lažna objekta iz fakes.ts
vi.mock("../src/config/prisma", async () => {
  const { fakePrisma } = await import("./fakes");
  return { prisma: fakePrisma };
});

vi.mock("../src/config/supabase", async () => {
  const { fakeSupabaseAuth } = await import("./fakes");
  const fakeClient = { auth: fakeSupabaseAuth };
  return {
    supabasePublic: fakeClient,
    createSupabaseAuthClient: () => fakeClient,
    createSupabaseAdminClient: () => fakeClient,
  };
});

// Pričakovane napake v testih ne smejo zasuti izpisa
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
