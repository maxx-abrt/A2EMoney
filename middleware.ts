import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
  isAuthenticatedNextjs,
} from "@convex-dev/auth/nextjs/server";

const isAuthPage = createRouteMatcher(["/auth", "/auth/(.*)"]);
const isPublicPage = createRouteMatcher([
  "/",
  "/auth",
  "/auth/(.*)",
  "/invite/(.*)",
  "/legal/(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuth = await convexAuth.isAuthenticated();
  if (isAuthPage(request) && isAuth) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }
  if (!isPublicPage(request) && !isAuth) {
    const next = request.nextUrl.pathname + request.nextUrl.search;
    return nextjsMiddlewareRedirect(
      request,
      `/auth?next=${encodeURIComponent(next)}`,
    );
  }
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next|favicon\\.ico).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
