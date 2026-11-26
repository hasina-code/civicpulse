import { randomBytes } from "node:crypto";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { PUBLIC_ROUTES } from "../../shared/constants/routes";
import { loginSchema } from "../../shared/validators/auth.schema";
import { prisma } from "../db/prisma";
import { hashPassword, verifyPassword } from "./password";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: PUBLIC_ROUTES.LOGIN },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            departmentId: true,
            isActive: true,
          },
        });

        if (
          !user ||
          !user.isActive ||
          !(await verifyPassword(parsed.data.password, user.passwordHash))
        ) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          id: true,
          role: true,
          departmentId: true,
          isActive: true,
        },
      });
      const databaseUser =
        existingUser ??
        (await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            name: user.name?.trim() || user.email,
            email: user.email,
            passwordHash: await hashPassword(randomBytes(32).toString("hex")),
            role: "CITIZEN",
          },
          select: {
            id: true,
            role: true,
            departmentId: true,
            isActive: true,
          },
        }));

      if (!databaseUser.isActive) {
        return false;
      }

      user.id = databaseUser.id;
      user.role = databaseUser.role;
      user.departmentId = databaseUser.departmentId;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.departmentId = token.departmentId ?? null;
      }

      return session;
    },
  },
};
