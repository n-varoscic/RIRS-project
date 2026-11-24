import { describe, expect, it } from "vitest";

import {
  addEmployeeToProject,
  removeEmployeeFromProject,
} from "../src/controllers/projectController";
import { fakePrisma } from "./fakes";
import { callHandler, manager } from "./helpers";

// Vodja (id 2) želi na projekt 10 dodeliti zaposlenega z id 3
const assignRequest = {
  params: { id: "10" },
  employee: manager,
  body: { idZaposleni: 3 },
};

const removeRequest = {
  params: { id: "10", employeeId: "3" },
  employee: manager,
};

describe("US-05 Dodeljevanje zaposlenih na projekt", () => {
  it("vodja na svoj projekt dodeli aktivnega zaposlenega", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: manager.id });
    fakePrisma.zaposleni.findFirst.mockResolvedValue({ id: 3 });
    fakePrisma.dodelitev.create.mockResolvedValue({ id: 1, idProjekt: 10, idZaposleni: 3 });

    const { status } = await callHandler(addEmployeeToProject, assignRequest);

    expect(status).toBe(201);
  });

  it("zavrne zaposlenega, ki nima aktivnega računa", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: manager.id });
    fakePrisma.zaposleni.findFirst.mockResolvedValue(null);

    const { status } = await callHandler(addEmployeeToProject, assignRequest);

    expect(status).toBe(400);
    expect(fakePrisma.zaposleni.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 3, aktiven: true } }),
    );
    expect(fakePrisma.dodelitev.create).not.toHaveBeenCalled();
  });

  it("prepreči, da bi bil isti zaposleni na projekt dodeljen dvakrat", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: manager.id });
    fakePrisma.zaposleni.findFirst.mockResolvedValue({ id: 3 });
    // P2002 je Prismina koda za kršitev enoličnosti (par projekt–zaposleni že obstaja)
    fakePrisma.dodelitev.create.mockRejectedValue({ code: "P2002" });

    const { status } = await callHandler(addEmployeeToProject, assignRequest);

    expect(status).toBe(409);
  });

  it("vodja ne more dodeljevati zaposlenih na projekt, ki ga ne vodi", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: 99 });
    fakePrisma.zaposleni.findFirst.mockResolvedValue({ id: 3 });

    const { status } = await callHandler(addEmployeeToProject, assignRequest);

    expect(status).toBe(403);
    expect(fakePrisma.dodelitev.create).not.toHaveBeenCalled();
  });

  it("odstranitev dodelitve ne izbriše že evidentiranih ur", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: manager.id });
    fakePrisma.dodelitev.deleteMany.mockResolvedValue({ count: 1 });

    const { status } = await callHandler(removeEmployeeFromProject, removeRequest);

    expect(status).toBe(204);
    expect(fakePrisma.dodelitev.deleteMany).toHaveBeenCalledWith({
      where: { idProjekt: 10, idZaposleni: 3 },
    });
    expect(fakePrisma.ure.deleteMany).not.toHaveBeenCalled();
  });

  it("vodja ne more odstraniti dodelitve s projekta, ki ga ne vodi", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: 99 });

    const { status } = await callHandler(removeEmployeeFromProject, removeRequest);

    expect(status).toBe(403);
    expect(fakePrisma.dodelitev.deleteMany).not.toHaveBeenCalled();
  });
});
