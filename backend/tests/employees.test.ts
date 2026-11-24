import { describe, expect, it } from "vitest";

import { addEmployee, editEmployee } from "../src/controllers/employeeController";
import { fakePrisma } from "./fakes";
import { callHandler } from "./helpers";

const newEmployee = {
  ime: "Marko",
  priimek: "Kovač",
  email: "marko@test.si",
  vloga: "WORKER",
  urnaPostavka: 15,
  aktiven: true,
};

// Zaposleni, kot ga vrne baza po shranjevanju
const savedEmployee = {
  id: 3,
  ime: "Marko",
  priimek: "Kovač",
  email: "marko@test.si",
  vloga: "WORKER",
  urnaPostavka: { toNumber: () => 15 },
  aktiven: false,
};

describe("US-02 Upravljanje računov zaposlenih", () => {
  it("zavrne negativno urno postavko", async () => {
    const { status } = await callHandler(addEmployee, {
      body: { ...newEmployee, urnaPostavka: -5 },
    });

    expect(status).toBe(400);
  });

  it("zavrne vlogo, ki ni ADMIN, PROJECT_MANAGER ali WORKER", async () => {
    const { status } = await callHandler(addEmployee, {
      body: { ...newEmployee, vloga: "DIREKTOR" },
    });

    expect(status).toBe(400);
  });

  it("zavrne ustvarjanje računa z e-pošto, ki jo že ima drug zaposleni", async () => {
    fakePrisma.zaposleni.findFirst.mockResolvedValue({ id: 7 });

    const { status } = await callHandler(addEmployee, { body: newEmployee });

    expect(status).toBe(409);
  });

  it("zavrne spremembo e-pošte v naslov drugega zaposlenega", async () => {
    fakePrisma.zaposleni.findUnique.mockResolvedValue({
      id: 3,
      supabaseUid: "uid-3",
      email: "marko@test.si",
    });
    fakePrisma.zaposleni.findFirst.mockResolvedValue({ id: 7 });

    const { status } = await callHandler(editEmployee, {
      params: { id: "3" },
      body: { ...newEmployee, email: "ana@test.si" },
    });

    expect(status).toBe(409);
    expect(fakePrisma.zaposleni.update).not.toHaveBeenCalled();
  });

  it("deaktivacija ohrani zaposlenega v bazi in ga samo označi kot neaktivnega", async () => {
    fakePrisma.zaposleni.findUnique.mockResolvedValue({
      id: 3,
      supabaseUid: "uid-3",
      email: "marko@test.si",
    });
    fakePrisma.zaposleni.update.mockResolvedValue(savedEmployee);

    const { status } = await callHandler(editEmployee, {
      params: { id: "3" },
      body: { ...newEmployee, aktiven: false },
    });

    expect(status).toBe(200);
    expect(fakePrisma.zaposleni.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ aktiven: false }) }),
    );
  });
});
