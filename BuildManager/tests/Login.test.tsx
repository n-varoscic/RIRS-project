import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import Login from "@/pages/Login";

// Namesto pravega backenda fetch vrne odgovor, ki ga določi test
function backendResponds(status: number, body: unknown) {
  const fakeFetch = vi.fn().mockResolvedValue({
    ok: status < 400,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fakeFetch);
  return fakeFetch;
}

// Odpre stran za prijavo, vpiše podatke in klikne gumb Prijava
function submitLoginForm() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<p>Nadzorna plošča</p>} />
      </Routes>
    </MemoryRouter>,
  );

  fireEvent.change(screen.getByLabelText("E-poštni naslov"), {
    target: { value: "ana@test.si" },
  });
  fireEvent.change(screen.getByLabelText("Geslo"), {
    target: { value: "geslo123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Prijava" }));
}

describe("US-01 Prijava v aplikacijo (stran za prijavo)", () => {
  it("po uspešni prijavi shrani prijavo in odpre nadzorno ploščo", async () => {
    const fakeFetch = backendResponds(200, {
      accessToken: "access",
      refreshToken: "refresh",
      expiresAt: 123,
      user: { vloga: "WORKER" },
    });

    submitLoginForm();

    expect(await screen.findByText("Nadzorna plošča")).toBeTruthy();
    expect(localStorage.getItem("accessToken")).toBe("access");
    expect(JSON.parse(localStorage.getItem("user") ?? "{}")).toEqual({ vloga: "WORKER" });
    expect(fakeFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/login"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("ob napačnih podatkih prikaže obvestilo, ki ne razkrije, kateri podatek je napačen", async () => {
    backendResponds(401, { code: "INVALID_CREDENTIALS" });

    submitLoginForm();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "E-poštni naslov ali geslo ni pravilno.",
    );
    expect(localStorage.getItem("accessToken")).toBeNull();
  });

  it("ob neaktivnem računu prikaže, da račun ni aktiven", async () => {
    backendResponds(403, { code: "INACTIVE_ACCOUNT" });

    submitLoginForm();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Uporabniški račun ni aktiven.",
    );
  });

  it("ko strežnik ni dosegljiv, prikaže obvestilo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    submitLoginForm();

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Povezava s strežnikom ni uspela. Poskusite znova pozneje.",
    );
  });
});
