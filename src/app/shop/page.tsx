"use client";
import { useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { FilterBar } from "@/components/shop/FilterBar";

const products = [
  {
    id: "1",
    name: "Golfreise Andalusien – Winter 2025",
    description:
      "7 Tage Training mit PGA-Coach in El Palmar inkl. Hotel & Greenfees.",
    price: 1290,
    image: "/images/reisen/andalusien.jpg",
    category: "Reise",
  },
  {
    id: "2",
    name: "Golfreise Portugal – Frühling 2026",
    description:
      "5 Tage Technikcamp an der Algarve mit PGA-Coach und Videoanalyse.",
    price: 1490,
    image: "/images/reisen/portugal.jpg",
    category: "Reise",
  },
];

export default function ShopPage() {
  const [filter, setFilter] = useState("Alle");
  const filtered =
    filter === "Alle"
      ? products
      : products.filter((p) => p.category === filter);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Golfreisen & Camps</h1>
      <FilterBar
        filter={filter}
        onChange={setFilter}
        categories={["Alle", "Reise"]}
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </main>
  );
}
