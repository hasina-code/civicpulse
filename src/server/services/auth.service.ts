import { Prisma } from "@prisma/client";
import type { z } from "zod";
import { registerSchema } from "../../shared/validators/auth.schema";
import { prisma } from "../db/prisma";
import { hashPassword } from "../auth/password";

export type RegistrationInput = z.infer<typeof registerSchema>;

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super("An account with this email already exists");
    this.name = "EmailAlreadyRegisteredError";
  }
}

export class RegistrationRoleRequiresInvitationError extends Error {
  constructor() {
    super("Manager, staff, and admin accounts require an invitation from an administrator");
    this.name = "RegistrationRoleRequiresInvitationError";
  }
}

export async function registerAccount(input: RegistrationInput) {
  if (input.role !== "CITIZEN") {
    throw new RegistrationRoleRequiresInvitationError();
  }

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
        role: input.role,
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
