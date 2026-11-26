import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_ROUTES, PUBLIC_ROUTES } from "./shared/constants/routes";
import { USER_ROLES, type UserRole } from "./shared/constants/roles";

const roleRoutePrefixes: Record<UserRole, readonly string[]> = {
  ADMIN: ["/admin"],
  MANAGER: ["/manager"],
  STAFF: ["/staff"],
  CITIZEN: ["/citizen"],
};

const sharedRoutePrefixes = ["/issues", "/map", "/notifications", "/settings"];
const signInRoutes = [PUBLIC_ROUTES.LOGIN, PUBLIC_ROUTES.REGISTER];
const publicAssetPrefixes = ["/images", "/videos"];

function isWithinRoute(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function dashboardRedirect(request: NextRequest, role: UserRole): NextResponse {
  return NextResponse.redirect(new URL(DASHBOARD_ROUTES[role], request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (publicAssetPrefixes.some((prefix) => isWithinRoute(pathname, prefix))) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  });

  if (!token) {
    if (
      pathname === PUBLIC_ROUTES.HOME ||
      signInRoutes.some((route) => isWithinRoute(pathname, route))
    ) {
      return NextResponse.next();
    }

    const loginUrl = new URL(PUBLIC_ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role;
  if (!role || !Object.values(USER_ROLES).includes(role)) {
    return NextResponse.redirect(new URL(PUBLIC_ROUTES.LOGIN, request.url));
  }

  if (signInRoutes.some((route) => isWithinRoute(pathname, route))) {
    return NextResponse.next();
  }

  const isRoleRoute = Object.values(roleRoutePrefixes).some((prefixes) =>
    prefixes.some((prefix) => isWithinRoute(pathname, prefix)),
  );
  const isAllowedRoleRoute = roleRoutePrefixes[role].some((prefix) =>
    isWithinRoute(pathname, prefix),
  );
  const isSharedRoute = sharedRoutePrefixes.some((prefix) =>
    isWithinRoute(pathname, prefix),
  );

  if (isRoleRoute && !isAllowedRoleRoute) {
    return dashboardRedirect(request, role);
  }

  if (isSharedRoute || isAllowedRoleRoute || pathname === PUBLIC_ROUTES.HOME) {
    return NextResponse.next();
  }

  return dashboardRedirect(request, role);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
