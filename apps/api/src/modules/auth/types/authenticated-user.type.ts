import type { UserRole } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  username: string;
};

export type TokenPayload = {
  email: string;
  role: UserRole;
  sub: string;
  username: string;
};
