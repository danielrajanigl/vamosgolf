"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Trip = {
  id: string;
  slug: string;
  title: { de?: string };
  base_price_cents: number;
  min_participants: number;
  max_participants: number;
  status: string;
};

export default function ReisenPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const sb = supabaseBrowser();

  useEffect(() => {
    sb.from("vamosgolf_trips")
      .select("*")
      .then(({ data }) => setTrips(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Reisen verwalten</h1>
        <Link href="/dashboard/reisen/editor">
          <Button>+ Neue Reise</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trips.map((t) => (
          <Card key={t.id} className="p-4 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-lg">{t.title?.de}</div>
              <div className="text-sm text-gray-600">Slug: {t.slug}</div>
              <div className="text-sm">
                Preis: {(t.base_price_cents / 100).toFixed(2)} €
              </div>
              <div className="text-sm text-gray-500">
                Teilnehmer: {t.min_participants}–{t.max_participants}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline">Bearbeiten</Button>
              <Button variant="destructive">Löschen</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
