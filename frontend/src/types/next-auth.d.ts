import type { DefaultSession } from "next-auth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- voir commentaire ci-dessus
import type { JWT } from "next-auth/jwt";

import type { Role } from "./roles";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      centreId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    centreId: string | null;
    //
    backendToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    centreId: string | null;
    backendToken: string;
  }
}
