import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

// Izriše stranski meni za uporabnika z izbrano vlogo
function renderMenuFor(vloga: string) {
  localStorage.setItem("accessToken", "token");
  localStorage.setItem("user", JSON.stringify({ vloga }));

  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path='/login' element={<p>Stran za prijavo</p>} />
        <Route
          path='/'
          element={
            <TooltipProvider>
              <SidebarProvider>
                <AppSidebar />
              </SidebarProvider>
            </TooltipProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

// Imena povezav, ki so v meniju vidne
function visibleLinks() {
  return screen.getAllByRole("link").map((link) => link.textContent);
}

describe("US-01 Meni glede na vlogo", () => {
  it("administrator vidi stranke, račune, projekte in ure", () => {
    renderMenuFor("ADMIN");

    expect(visibleLinks()).toEqual([
      "BuildManager",
      "Nadzorna plošča",
      "Stranke",
      "Računi",
      "Projekti",
      "Ure",
    ]);
  });

  it("projektni vodja vidi projekte, ne pa strank in računov", () => {
    renderMenuFor("PROJECT_MANAGER");

    expect(visibleLinks()).toEqual(["BuildManager", "Nadzorna plošča", "Projekti", "Ure"]);
  });

  it("delavec vidi samo nadzorno ploščo in ure", () => {
    renderMenuFor("WORKER");

    expect(visibleLinks()).toEqual(["BuildManager", "Nadzorna plošča", "Ure"]);
  });

  it("odjava pobriše prijavo in odpre stran za prijavo", () => {
    renderMenuFor("WORKER");

    fireEvent.click(screen.getByRole("button", { name: "Odjava" }));

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(screen.getByText("Stran za prijavo")).toBeTruthy();
  });
});
