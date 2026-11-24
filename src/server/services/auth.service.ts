import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { citizenRegistrationSchema } from "../../shared/validators/auth.schema";
import { prisma } from "../db/prisma";
import { hashPassword } from "../auth/password";

export type CitizenRegistrationInput = z.infer<typeof citizenRegistrationSchema>;

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export async function registerCitizen(input: CitizenRegistrationInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new EmailAlreadyRegisteredError();
  }

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        phone: input.phone || null,
        role: "CITIZEN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new EmailAlreadyRegisteredError();
    }

    throw error;
  }
}
