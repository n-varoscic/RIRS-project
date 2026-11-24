import { describe, expect, it } from "vitest";

import { addProject, editProject } from "../src/controllers/projectController";
import { fakePrisma } from "./fakes";
import { callHandler, manager, worker } from "./helpers";

const newProject = {
  naziv: "Hiša Novak",
  opis: "Gradnja enodružinske hiše",
  idStranka: 1,
  idVodjaProjekta: 2,
  lokacija: "Maribor",
  datumZacetka: "2026-12-01",
  datumZakljucka: "2027-03-31",
  dogovorjenaCena: 50000,
};

const projectChanges = {
  opis: "Gradnja hiše z garažo",
  datumZacetka: "2026-12-15",
  datumZakljucka: "2027-04-30",
  status: "V_TEKU",
};

// Projekt, kot ga vrne baza po shranjevanju
const savedProject = {
  id: 10,
  naziv: "Hiša Novak",
  opis: "Gradnja enodružinske hiše",
  lokacija: "Maribor",
  datumZacetka: new Date("2026-12-01"),
  datumZakljucka: new Date("2027-03-31"),
  dogovorjenaCena: { toNumber: () => 50000 },
  status: "NACRTOVAN",
  stranka: { id: 1, naziv: "Gradnje d.o.o." },
  vodjaProjekta: { id: 2, ime: "Petra", priimek: "Horvat" },
};

describe("US-03 Ustvarjanje in načrtovanje projekta", () => {
  it("shrani projekt z začetnim statusom NACRTOVAN", async () => {
    fakePrisma.stranka.findUnique.mockResolvedValue({ id: 1 });
    fakePrisma.zaposleni.findFirst.mockResolvedValue({ id: 2 });
    fakePrisma.projekt.create.mockResolvedValue(savedProject);

    const { status } = await callHandler(addProject, { body: newProject });

    expect(status).toBe(201);
    expect(fakePrisma.projekt.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "NACRTOVAN" }) }),
    );
  });

  it("zavrne datum zaključka pred datumom začetka", async () => {
    const { status } = await callHandler(addProject, {
      body: { ...newProject, datumZacetka: "2027-03-31", datumZakljucka: "2026-12-01" },
    });

    expect(status).toBe(400);
    expect(fakePrisma.projekt.create).not.toHaveBeenCalled();
  });

  it("zavrne negativno dogovorjeno ceno", async () => {
    const { status } = await callHandler(addProject, {
      body: { ...newProject, dogovorjenaCena: -100 },
    });

    expect(status).toBe(400);
  });

  it("za vodjo sprejme samo aktivnega projektnega vodjo", async () => {
    fakePrisma.stranka.findUnique.mockResolvedValue({ id: 1 });
    fakePrisma.zaposleni.findFirst.mockResolvedValue(null);

    const { status, body } = await callHandler(addProject, { body: newProject });

    expect(status).toBe(400);
    expect(body).toMatchObject({ code: "MANAGER_NOT_AVAILABLE" });
    expect(fakePrisma.zaposleni.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2, aktiven: true, vloga: "PROJECT_MANAGER" },
      }),
    );
  });
});

describe("US-04 Posodabljanje načrta in statusa projekta", () => {
  it("vodja pri svojem projektu spremeni samo opis, datuma in status, ne pa cene ali stranke", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: manager.id });
    fakePrisma.projekt.update.mockResolvedValue(savedProject);

    const { status } = await callHandler(editProject, {
      params: { id: "10" },
      employee: manager,
      body: { ...projectChanges, dogovorjenaCena: 1, idStranka: 99 },
    });

    expect(status).toBe(200);
    expect(fakePrisma.projekt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          opis: "Gradnja hiše z garažo",
          datumZacetka: new Date("2026-12-15"),
          datumZakljucka: new Date("2027-04-30"),
          status: "V_TEKU",
        },
      }),
    );
  });

  it("vodja ne more urejati projekta, ki ga ne vodi", async () => {
    fakePrisma.projekt.findUnique.mockResolvedValue({ idVodjaProjekta: 99 });

    const { status } = await callHandler(editProject, {
      params: { id: "10" },
      employee: manager,
      body: projectChanges,
    });

    expect(status).toBe(403);
    expect(fakePrisma.projekt.update).not.toHaveBeenCalled();
  });

  it("zavrne spremembo, pri kateri je zaključek pred začetkom", async () => {
    const { status, body } = await callHandler(editProject, {
      params: { id: "10" },
      employee: manager,
      body: { ...projectChanges, datumZakljucka: "2026-12-01" },
    });

    expect(status).toBe(400);
    expect(body).toMatchObject({
      message: "Datum zaključka ne sme biti pred datumom začetka.",
    });
  });

  it("delavec ne more urejati projekta", async () => {
    const { status } = await callHandler(editProject, {
      params: { id: "10" },
      employee: worker,
      body: projectChanges,
    });

    expect(status).toBe(403);
  });
});
