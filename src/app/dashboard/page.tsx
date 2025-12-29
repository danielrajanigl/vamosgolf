"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardEntry() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  
  // Login/Register States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        // Wenn kein User gefunden wird, Login/Register anzeigen
        if (!currentUser || authError) {
          setUser(null);
          setLoading(false);
          return;
        }

        // User gefunden - Profil prüfen
        setUser(currentUser);
        const { data: profile, error: profileError } = await supabase
          .from("vamosgolf_profiles")
          .select("role, full_name, email")
          .eq("id", currentUser.id)
          .single();

        const role = profile?.role;
        
        // User ist eingeloggt und hat Profil → Dashboard anzeigen
        if (role && !profileError) {
          setUserRole(role);
          setUserProfile(profile);
          setLoading(false);
          // Dashboard-Inhalt wird basierend auf Rolle angezeigt
          return;
        }
        
        // Kein Profil oder Fehler → Login/Register anzeigen
        setUser(null);
        setLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
        setLoading(false);
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      const { data: profile } = await supabase
        .from("vamosgolf_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        await supabase.from("vamosgolf_profiles").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata.full_name || null,
          role: "client",
        });
      }

      // Seite neu laden um Dashboard anzuzeigen
      router.refresh();
      window.location.reload();
    } catch (error: any) {
      setError(error.message || "Anmeldung fehlgeschlagen");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("Passwort muss mindestens 6 Zeichen lang sein");
      setAuthLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("vamosgolf_profiles")
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName || null,
            role: "client",
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
        }
      }

      setMessage(
        "Registrierung erfolgreich! Bitte überprüfe deine Email für den Bestätigungslink."
      );
      
      setEmail("");
      setPassword("");
      setFullName("");
    } catch (error: any) {
      setError(error.message || "Registrierung fehlgeschlagen");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setAuthLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?redirect=/dashboard`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (error: any) {
      setError(error.message || "Google Anmeldung fehlgeschlagen");
      setAuthLoading(false);
    }
  }

  async function handleAppleAuth() {
    setAuthLoading(true);
    setError(null);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?redirect=/dashboard`,
        },
      });

      if (oauthError) throw oauthError;
    } catch (error: any) {
      setError(error.message || "Apple Anmeldung fehlgeschlagen");
      setAuthLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Lädt Dashboard …
      </div>
    );
  }

  // Wenn nicht eingeloggt, Login/Register anzeigen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">
              {showLogin ? "Anmelden" : "Konto erstellen"}
            </CardTitle>
            <CardDescription>
              {showLogin
                ? "Melde dich an um fortzufahren"
                : "Registriere dich für exklusive Golf-Erlebnisse"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={authLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAppleAuth}
                disabled={authLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.09 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {showLogin ? "Oder mit Email" : "Oder mit Email"}
                </span>
              </div>
            </div>

            {showLogin ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={authLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? "Anmeldung läuft..." : "Anmelden"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Max Mustermann"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={authLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="deine@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={authLoading}
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? "Registrierung läuft..." : "Konto erstellen"}
                </Button>
              </form>
            )}

            <div className="text-center text-sm text-gray-600">
              {showLogin ? (
                <>
                  Noch kein Konto?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(false);
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Jetzt registrieren
                  </button>
                </>
              ) : (
                <>
                  Bereits registriert?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogin(true);
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    Jetzt anmelden
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User ist eingeloggt - Dashboard-Inhalt anzeigen
  const role = userRole || "client";

  if (role === "admin" || role === "editor") {
    return <AdminDashboard userProfile={userProfile} />;
  }

  return <ClientDashboard user={user} userProfile={userProfile} />;
}

// Admin/Editor Dashboard
function AdminDashboard({ userProfile }: { userProfile: any }) {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          fetch("/api/admin/dashboard/stats"),
          fetch("/api/admin/dashboard/bookings?upcoming=true&limit=5"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setBookings(bookingsData.bookings || []);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Willkommen zurück, {userProfile?.full_name || "Admin"}!
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Buchungen (Gesamt)</CardDescription>
            <CardTitle className="text-3xl">{stats.bookings.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div>Heute: +{stats.bookings.today}</div>
              <div>Diese Woche: {stats.bookings.thisWeek}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardDescription>Umsatz (Gesamt)</CardDescription>
            <CardTitle className="text-3xl">
              {stats.revenue.total.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div>Heute: {stats.revenue.today.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}</div>
              <div>Dieser Monat: {stats.revenue.thisMonth.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription>Anstehende Termine</CardDescription>
            <CardTitle className="text-3xl">{stats.dates.upcoming}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div>Bestätigt: {stats.dates.confirmed}</div>
              <div>Geplant: {stats.dates.planned}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <CardDescription>Kapazität</CardDescription>
            <CardTitle className="text-3xl">
              {stats.capacity.availableSpots}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <div>Gebucht: {stats.capacity.bookedSpots}/{stats.capacity.totalSpots}</div>
              <div className="text-orange-600 font-medium">
                {stats.capacity.lowCapacityDates} Termine mit wenig Plätzen
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zahlungsstatus Übersicht */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ausstehend</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {stats.bookings.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Anzahlung bezahlt</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {stats.bookings.depositPaid}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Vollständig bezahlt</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {stats.bookings.paid}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ausgebuchte Termine</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {stats.capacity.fullDates}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Anstehende Buchungen */}
        <Card>
          <CardHeader>
            <CardTitle>Anstehende Buchungen</CardTitle>
            <CardDescription>Die neuesten Buchungen für kommende Reisen</CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Keine anstehenden Buchungen
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    {booking.trip_image_url && (
                      <img
                        src={booking.trip_image_url}
                        alt=""
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {booking.trip_title}
                      </div>
                      <div className="text-sm text-gray-600">
                        {booking.customer_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {booking.start_date &&
                          new Date(booking.start_date).toLocaleDateString("de-DE")}
                        {" • "}
                        {booking.persons} {booking.persons === 1 ? "Person" : "Personen"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {booking.total_amount.toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </div>
                      <div
                        className={`text-xs ${
                          booking.payment_status === "paid"
                            ? "text-green-600"
                            : booking.payment_status === "deposit_paid"
                            ? "text-blue-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {booking.payment_status === "paid"
                          ? "Bezahlt"
                          : booking.payment_status === "deposit_paid"
                          ? "Anzahlung"
                          : "Ausstehend"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kapazitäts-Übersicht */}
        <Card>
          <CardHeader>
            <CardTitle>Kapazitäts-Übersicht</CardTitle>
            <CardDescription>Anstehende Termine mit Auslastung</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingDates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Keine anstehenden Termine
              </p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingDates.slice(0, 5).map((date: any) => (
                  <div
                    key={date.id}
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">
                        {new Date(date.start_date).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                        })}
                        {" - "}
                        {new Date(date.end_date).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                      <div
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          date.is_full
                            ? "bg-red-100 text-red-700"
                            : date.utilization_rate >= 80
                            ? "bg-orange-100 text-orange-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {date.is_full
                          ? "Ausgebucht"
                          : `${date.utilization_rate}%`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span>Teilnehmer</span>
                          <span>
                            {date.current_bookings}/{date.max_participants}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              date.is_full
                                ? "bg-red-500"
                                : date.utilization_rate >= 80
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(date.utilization_rate, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    {date.available_spots > 0 && date.available_spots <= 5 && (
                      <div className="mt-2 text-xs text-orange-600 font-medium">
                        ⚠️ Nur noch {date.available_spots} Plätze verfügbar
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Client Dashboard
function ClientDashboard({ user, userProfile }: { user: any; userProfile: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        const res = await fetch("/api/dashboard/bookings");
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        }
      } catch (error) {
        console.error("Error loading bookings:", error);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, []);

  const upcomingBookings = bookings.filter((b) => b.is_upcoming);
  const pastBookings = bookings.filter((b) => !b.is_upcoming);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Buchungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Willkommen zurück!</h1>
        <p className="text-gray-600 mt-2">
          {userProfile?.full_name || user?.email}
        </p>
      </div>

      {/* Statistik Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription>Meine Buchungen</CardDescription>
            <CardTitle className="text-3xl">{bookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardDescription>Anstehende Reisen</CardDescription>
            <CardTitle className="text-3xl">{upcomingBookings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-3">
            <CardDescription>Vergangene Reisen</CardDescription>
            <CardTitle className="text-3xl">{pastBookings.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Anstehende Buchungen */}
      {upcomingBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Anstehende Reisen</CardTitle>
            <CardDescription>Deine kommenden Golfreisen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  {booking.trip_image_url && (
                    <img
                      src={booking.trip_image_url}
                      alt=""
                      className="w-20 h-20 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{booking.trip_title}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>
                        📅{" "}
                        {booking.start_date &&
                          new Date(booking.start_date).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        {" - "}
                        {booking.end_date &&
                          new Date(booking.end_date).toLocaleDateString("de-DE", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                      </div>
                      <div className="mt-1">
                        👥 {booking.persons}{" "}
                        {booking.persons === 1 ? "Person" : "Personen"}
                      </div>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          booking.payment_status === "paid"
                            ? "bg-green-100 text-green-700"
                            : booking.payment_status === "deposit_paid"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {booking.payment_status === "paid"
                          ? "✓ Vollständig bezahlt"
                          : booking.payment_status === "deposit_paid"
                          ? "⏳ Anzahlung bezahlt"
                          : "⏸ Ausstehend"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      {booking.total_amount.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                    {booking.payment_status !== "paid" && (
                      <div className="text-sm text-gray-600 mt-1">
                        {booking.rest_amount > 0 &&
                          `Noch ${booking.rest_amount.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                          })} offen`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alle Buchungen */}
      <Card>
        <CardHeader>
          <CardTitle>Alle Buchungen</CardTitle>
          <CardDescription>Übersicht aller deiner Golfreisen</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Du hast noch keine Buchungen
              </p>
              <Button
                onClick={() => (window.location.href = "/reisen")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Reisen entdecken
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  {booking.trip_image_url && (
                    <img
                      src={booking.trip_image_url}
                      alt=""
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{booking.trip_title}</div>
                    <div className="text-sm text-gray-600">
                      {booking.start_date &&
                        new Date(booking.start_date).toLocaleDateString("de-DE")}
                      {" • "}
                      {booking.persons} {booking.persons === 1 ? "Person" : "Personen"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {booking.total_amount.toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </div>
                    <div
                      className={`text-xs ${
                        booking.payment_status === "paid"
                          ? "text-green-600"
                          : booking.payment_status === "deposit_paid"
                          ? "text-blue-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {booking.payment_status === "paid"
                        ? "Bezahlt"
                        : booking.payment_status === "deposit_paid"
                        ? "Anzahlung"
                        : "Ausstehend"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
