import { getServerSession } from "next-auth";

// ---- CORE IMPORTS ---- //
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}
