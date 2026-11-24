import type { NextFunction, Request, Response } from "express";

import type { AuthenticatedEmployee } from "../src/middleware/requireEmployee";

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

type FakeRequest = {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  token?: string;
  employee?: AuthenticatedEmployee;
};

// Prijavljeni zaposleni, ki jih testi uporabljajo kot »trenutnega uporabnika«
export const admin: AuthenticatedEmployee = { id: 1, role: "ADMIN" };
export const manager: AuthenticatedEmployee = { id: 2, role: "PROJECT_MANAGER" };
export const worker: AuthenticatedEmployee = { id: 3, role: "WORKER" };

// Pokliče controller ali middleware z lažnim zahtevkom in vrne, kaj je odgovoril
export async function callHandler(handler: Handler, request: FakeRequest = {}) {
  const result = {
    status: 200,
    body: undefined as unknown,
    nextCalled: false,
  };

  const req = {
    body: request.body ?? {},
    params: request.params ?? {},
    query: request.query ?? {},
    header: (name: string) =>
      name.toLowerCase() === "authorization" && request.token
        ? `Bearer ${request.token}`
        : undefined,
  };

  const res = {
    locals: { employee: request.employee },
    status(code: number) {
      result.status = code;
      return res;
    },
    json(data: unknown) {
      result.body = data;
      return res;
    },
    send() {
      return res;
    },
  };

  await handler(req as unknown as Request, res as unknown as Response, () => {
    result.nextCalled = true;
  });

  return { ...result, locals: res.locals };
}
