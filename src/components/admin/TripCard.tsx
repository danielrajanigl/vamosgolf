"use client";
import { useState } from "react";

export default function TripCard({ trip }: { trip: any }) {
  const [loading, setLoading] = useState(false);
  const handleSync = async () => {
    setLoading(true);
    const res = await fetch("/api/stripe/sync-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trip_id: trip.id }),
    });
    const data = await res.json();
    setLoading(false);
    alert(
      data.success
        ? "✅ Mit Stripe synchronisiert!"
        : `❌ Fehler: ${data.error}`
    );
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <h3 className="font-semibold text-lg">{trip.title?.de}</h3>
      <p className="text-sm text-gray-600 mb-2">
        Preis: {trip.base_price_cents / 100} €
      </p>
      <button
        onClick={handleSync}
        disabled={loading}
        className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
      >
        {loading ? "Synchronisiere..." : "Mit Stripe synchronisieren"}
      </button>
    </div>
  );
}
