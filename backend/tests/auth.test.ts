import { describe, expect, it } from "vitest";

import { login } from "../src/controllers/authController";
import { requireAdmin } from "../src/middleware/requireAdmin";
import { requireEmployee } from "../src/middleware/requireEmployee";
import { fakePrisma, fakeSupabaseAuth } from "./fakes";
import { callHandler } from "./helpers";

const activeAdmin = {
  id: 1,
  ime: "Ana",
  priimek: "Novak",
  email: "ana@test.si",
  vloga: "ADMIN",
  aktiven: true,
};

// Supabase sprejme e-pošto in geslo
function passwordIsCorrect() {
  fakeSupabaseAuth.signInWithPassword.mockResolvedValue({
    data: {
      user: { id: "supabase-uid" },
      session: { access_token: "access", refresh_token: "refresh", expires_at: 123 },
    },
    error: null,
  });
}

// Supabase prepozna žeton prijavljenega uporabnika
function tokenIsValid() {
  fakeSupabaseAuth.getUser.mockResolvedValue({
    data: { user: { id: "supabase-uid" } },
    error: null,
  });
}

const loginBody = { email: "ana@test.si", password: "geslo123" };

describe("US-01 Prijava v aplikacijo", () => {
  it("prijavi aktivnega zaposlenega in vrne njegovo vlogo", async () => {
    passwordIsCorrect();
    fakePrisma.zaposleni.findUnique.mockResolvedValue(activeAdmin);

    const { status, body } = await callHandler(login, { body: loginBody });

    expect(status).toBe(200);
    expect(body).toMatchObject({ accessToken: "access", user: { vloga: "ADMIN" } });
  });

  it("ob napačnem geslu ne razkrije, kateri podatek je napačen", async () => {
    fakeSupabaseAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { status, body } = await callHandler(login, { body: loginBody });

    expect(status).toBe(401);
    expect(body).toMatchObject({ message: "E-poštni naslov ali geslo ni pravilno." });
  });

  it("zavrne prijavo z neaktivnim računom", async () => {
    passwordIsCorrect();
    fakePrisma.zaposleni.findUnique.mockResolvedValue({ ...activeAdmin, aktiven: false });

    const { status, body } = await callHandler(login, { body: loginBody });

    expect(status).toBe(403);
    expect(body).toMatchObject({ message: "Uporabniški račun ni aktiven." });
  });

  it("zavrne prijavo brez gesla, še preden vpraša Supabase", async () => {
    const { status } = await callHandler(login, { body: { email: "ana@test.si" } });

    expect(status).toBe(400);
    expect(fakeSupabaseAuth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("Zaščita API-ja po vlogah (US-01, US-02, US-03, US-10)", () => {
  it("brez prijave zavrne dostop", async () => {
    const { status, nextCalled } = await callHandler(requireEmployee);

    expect(status).toBe(401);
    expect(nextCalled).toBe(false);
  });

  it("deaktiviranemu zaposlenemu zavrne dostop", async () => {
    tokenIsValid();
    fakePrisma.zaposleni.findUnique.mockResolvedValue({ id: 3, vloga: "WORKER", aktiven: false });

    const { status, nextCalled } = await callHandler(requireEmployee, { token: "token" });

    expect(status).toBe(403);
    expect(nextCalled).toBe(false);
  });

  it("delavcu ne dovoli dostopa do funkcij administratorja", async () => {
    tokenIsValid();
    fakePrisma.zaposleni.findUnique.mockResolvedValue({ vloga: "WORKER", aktiven: true });

    const { status, nextCalled } = await callHandler(requireAdmin, { token: "token" });

    expect(status).toBe(403);
    expect(nextCalled).toBe(false);
  });

  it("administratorju dovoli dostop do funkcij administratorja", async () => {
    tokenIsValid();
    fakePrisma.zaposleni.findUnique.mockResolvedValue({ vloga: "ADMIN", aktiven: true });

    const { nextCalled } = await callHandler(requireAdmin, { token: "token" });

    expect(nextCalled).toBe(true);
  });
});
