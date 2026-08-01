import { Role } from '@prisma/client';

// Shape of the data we encode into the JWT and get back after verification.
export interface JwtPayload {
  sub: string; // user id ("subject" — standard JWT claim name)
  email: string;
  role: Role;
}
