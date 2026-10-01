import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Route-level role check (every API also checks roles itself).
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;
    const deny = () => NextResponse.redirect(new URL("/forbidden", req.url));
    if (pathname.startsWith("/guard") && role !== "GUARD" && role !== "ADMIN") return deny();
    if (pathname.startsWith("/admin") && role !== "ADMIN") return deny();
    return NextResponse.next();
  },
  { pages: { signIn: "/login" } },
);

export const config = { matcher: ["/student/:path*", "/guard/:path*", "/admin/:path*"] };
