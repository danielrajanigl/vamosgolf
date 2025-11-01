"use client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const products = [
  {
    id: "1",
    name: "Golfreise Andalusien – Winter 2025",
    description:
      "7 Tage PGA-Training am Atlantik mit täglicher Videoanalyse, Hotel direkt am Strand.",
    price: 1290,
    image: "/images/reisen/andalusien.jpg",
  },
  {
    id: "2",
    name: "Golfreise Portugal – Frühling 2026",
    description:
      "5 Tage Techniktraining an der Algarve inkl. Greenfees und Transfer.",
    price: 1490,
    image: "/images/reisen/portugal.jpg",
  },
];

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const product = products.find((p) => p.id === id);
  if (!product) return <div className="p-8">Produkt nicht gefunden.</div>;

  const handleCheckout = async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return (
    <main className="p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        ← Zurück
      </Button>
      <div className="grid md:grid-cols-2 gap-8">
        <img
          src={product.image}
          alt={product.name}
          className="rounded-xl w-full h-96 object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
          <p className="text-gray-700 mb-6">{product.description}</p>
          <p className="text-2xl font-semibold mb-6">{product.price} €</p>
          <Button
            onClick={handleCheckout}
            className="bg-green-700 text-white px-8 py-3 rounded-lg"
          >
            Jetzt buchen
          </Button>
        </div>
      </div>
    </main>
  );
}
