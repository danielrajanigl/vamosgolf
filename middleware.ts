import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options: CookieOptions) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options: CookieOptions) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // /dashboard selbst erlauben - zeigt Login/Register wenn nicht eingeloggt
  // Nur Unterrouten schützen
  const isDashboardRoot = path === "/dashboard" || path === "/dashboard/";
  
  if (!isDashboardRoot && path.startsWith("/dashboard")) {
    // Nicht eingeloggt → Login
    if (!user) {
      return NextResponse.redirect(new URL("/login?redirect=" + path, request.url));
    }

    // Profilrolle prüfen für geschützte Routen
    const { data: profile } = await supabase
      .from("vamosgolf_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Zugriffskontrolle pro Rolle
    if (path.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith("/dashboard/editor") && !["admin", "editor"].includes(role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (path.startsWith("/dashboard/client") && role !== "client") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
