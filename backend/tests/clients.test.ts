import { describe, expect, it } from "vitest";

import { addClient } from "../src/controllers/clientController";
import { fakePrisma } from "./fakes";
import { callHandler } from "./helpers";

const newClient = {
  naziv: "Gradnje d.o.o.",
  email: "info@gradnje.si",
  telefonskaStevilka: "041 123 456",
  naslov: "Glavna ulica 1, Maribor",
  davcnaStevilka: "12345678",
};

describe("US-10 Upravljanje strank", () => {
  it("ustvari stranko z vsemi kontaktnimi podatki", async () => {
    fakePrisma.stranka.findFirst.mockResolvedValue(null);
    fakePrisma.stranka.findUnique.mockResolvedValue(null);
    fakePrisma.stranka.create.mockResolvedValue({ id: 1, ...newClient });

    const { status, body } = await callHandler(addClient, { body: newClient });

    expect(status).toBe(201);
    expect(body).toMatchObject({ client: { id_Stranka: 1, ...newClient } });
  });

  it("zavrne stranko brez naziva", async () => {
    const { status } = await callHandler(addClient, {
      body: { ...newClient, naziv: "  " },
    });

    expect(status).toBe(400);
    expect(fakePrisma.stranka.create).not.toHaveBeenCalled();
  });

  it("zavrne neveljaven e-poštni naslov", async () => {
    const { status } = await callHandler(addClient, {
      body: { ...newClient, email: "info-gradnje.si" },
    });

    expect(status).toBe(400);
    expect(fakePrisma.stranka.create).not.toHaveBeenCalled();
  });

  it("zavrne e-poštni naslov, ki ga že ima druga stranka", async () => {
    fakePrisma.stranka.findFirst.mockResolvedValue({ id: 5 });
    fakePrisma.stranka.findUnique.mockResolvedValue(null);

    const { status } = await callHandler(addClient, { body: newClient });

    expect(status).toBe(409);
  });
});
