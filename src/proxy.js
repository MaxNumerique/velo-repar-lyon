import { clerkMiddleware, createRouteMatcher, createClerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const isInterventionsRoute = createRouteMatcher(['/interventions(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  let role = sessionClaims?.publicMetadata?.role;
  if (userId && !role) {
    const user = await clerkClient.users.getUser(userId);
    role = user.publicMetadata?.role;
  }
  const url = new URL(req.url);
  console.log(`Middleware: URL=${url.pathname}, Role=${role}, UserId=${userId}`);
  if (isInterventionsRoute(req) && role === 'ADMIN') {
    return NextResponse.redirect(new URL('/admin/interventions', req.url));
  }
  if (isAdminRoute(req) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/interventions', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
    '/(api|trpc)(.*)',
  ],
};
