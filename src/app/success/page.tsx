"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Wird verarbeitet...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const session_id = params.get("session_id");
      if (!session_id) return;
      const res = await fetch(`/api/verify?session_id=${session_id}`);
      const data = await res.json();
      setSuccess(data.success);
      setStatus(
        data.success ? "Zahlung erfolgreich!" : "Fehler bei der Verarbeitung."
      );
    };
    verify();
  }, [params]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          {success ? (
            <>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-sky-100 mb-6 animate-slide-up">
                <CheckCircle2 className="h-12 w-12 text-sky-600" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Buchung erfolgreich!
              </h1>
              <p className="text-xl text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                Vielen Dank für deine Buchung. Wir haben eine Bestätigungs-E-Mail an dich gesendet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <Link href="/dashboard">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    Zum Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/shop">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-sky-500 text-sky-600 hover:bg-sky-500 hover:text-white text-lg px-8 py-6 h-auto transition-all duration-300"
                  >
                    Weitere Reisen
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-6">
                <Sparkles className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                {status}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Bitte kontaktiere uns, falls du Fragen hast.
              </p>
              <Button
                onClick={() => router.push("/shop")}
                size="lg"
                className="bg-sky-500 hover:bg-sky-600 text-white text-lg px-8 py-6 h-auto"
              >
                Zurück zum Shop
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
