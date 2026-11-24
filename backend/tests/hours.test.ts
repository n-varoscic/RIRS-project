import { describe, expect, it } from "vitest";

import { addHour, listMonthlyHours } from "../src/controllers/hourController";
import { fakePrisma } from "./fakes";
import { callHandler, worker } from "./helpers";

const newHour = { idProjekt: 10, datum: "2026-11-20", steviloUr: 8 };

// Vnos ur, kot ga vrne baza po shranjevanju
const savedHour = {
  id: 1,
  datum: new Date("2026-11-20"),
  steviloUr: { toNumber: () => 8 },
  urnaPostavka: { toNumber: () => 15 },
  projekt: { id: 10, naziv: "Hiša Novak" },
};

describe("US-06 Beleženje opravljenih delovnih ur", () => {
  it.each([0, 25])("zavrne vnos %s ur (dovoljeno je več kot 0 in največ 24)", async (hours) => {
    const { status } = await callHandler(addHour, {
      employee: worker,
      body: { ...newHour, steviloUr: hours },
    });

    expect(status).toBe(400);
    expect(fakePrisma.ure.create).not.toHaveBeenCalled();
  });

  it("zavrne datum, ki ne obstaja", async () => {
    const { status } = await callHandler(addHour, {
      employee: worker,
      body: { ...newHour, datum: "2026-02-30" },
    });

    expect(status).toBe(400);
  });

  it("zavrne vnos za projekt, na katerega delavec ni dodeljen", async () => {
    fakePrisma.zaposleni.findUnique.mockResolvedValue({ urnaPostavka: 15 });
    fakePrisma.dodelitev.findUnique.mockResolvedValue(null);

    const { status } = await callHandler(addHour, { employee: worker, body: newHour });

    expect(status).toBe(403);
    expect(fakePrisma.ure.create).not.toHaveBeenCalled();
  });

  it("vnos poveže s prijavljenim delavcem in shrani njegovo trenutno urno postavko", async () => {
    fakePrisma.zaposleni.findUnique.mockResolvedValue({ urnaPostavka: 15 });
    fakePrisma.dodelitev.findUnique.mockResolvedValue({ id: 1 });
    fakePrisma.ure.create.mockResolvedValue(savedHour);

    // Delavec poskusi ure vpisati v imenu drugega zaposlenega (id 99)
    const { status } = await callHandler(addHour, {
      employee: worker,
      body: { ...newHour, steviloUr: 24, idZaposleni: 99 },
    });

    expect(status).toBe(201);
    expect(fakePrisma.ure.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          idProjekt: 10,
          idZaposleni: worker.id,
          datum: new Date("2026-11-20"),
          steviloUr: 24,
          urnaPostavka: 15,
        },
      }),
    );
  });

  it("mesečna evidenca vrne samo ure prijavljenega delavca v izbranem mesecu", async () => {
    fakePrisma.ure.findMany.mockResolvedValue([savedHour]);

    const { status, body } = await callHandler(listMonthlyHours, {
      employee: worker,
      query: { month: "2026-11" },
    });

    expect(status).toBe(200);
    expect(body).toMatchObject({ hours: [{ datum: "2026-11-20", steviloUr: 8 }] });
    expect(fakePrisma.ure.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          idZaposleni: worker.id,
          datum: { gte: new Date("2026-11-01"), lt: new Date("2026-12-01") },
        },
      }),
    );
  });

  it("mesečna evidenca zavrne neveljaven mesec", async () => {
    const { status } = await callHandler(listMonthlyHours, {
      employee: worker,
      query: { month: "2026-13" },
    });

    expect(status).toBe(400);
  });
});
