"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Wird verarbeitet...");

  useEffect(() => {
    const verify = async () => {
      const session_id = params.get("session_id");
      if (!session_id) return;
      const res = await fetch(`/api/verify?session_id=${session_id}`);
      const data = await res.json();
      setStatus(
        data.success ? "Zahlung erfolgreich!" : "Fehler bei der Verarbeitung."
      );
    };
    verify();
  }, [params]);

  return (
    <main className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">Buchung</h1>
      <p>{status}</p>
      <button
        onClick={() => router.push("/shop")}
        className="mt-6 px-6 py-2 bg-green-700 text-white rounded-lg"
      >
        Zurück zum Shop
      </button>
    </main>
  );
}
