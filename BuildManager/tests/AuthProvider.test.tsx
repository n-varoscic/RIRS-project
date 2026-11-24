import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AuthProvider from "@/components/AuthProvider";

// Izriše zaščiteno stran »/« in stran za prijavo
function renderProtectedPage() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path='/login' element={<p>Stran za prijavo</p>} />
        <Route
          path='/'
          element={
            <AuthProvider>
              <p>Zaščitena stran</p>
            </AuthProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("US-01 Dostop samo za prijavljene", () => {
  it("neprijavljenega uporabnika preusmeri na prijavo", () => {
    renderProtectedPage();

    expect(screen.getByText("Stran za prijavo")).toBeTruthy();
    expect(screen.queryByText("Zaščitena stran")).toBeNull();
  });

  it("prijavljenemu uporabniku prikaže stran", () => {
    localStorage.setItem("accessToken", "token");

    renderProtectedPage();

    expect(screen.getByText("Zaščitena stran")).toBeTruthy();
  });
});
