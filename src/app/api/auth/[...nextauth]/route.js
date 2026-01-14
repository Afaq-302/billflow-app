// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic"; // force runtime evaluation per request
export const revalidate = 0;
export const runtime = "nodejs";        // important: next-auth v4 is not Edge-friendly

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
