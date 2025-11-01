"use client";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(`/shop/${product.id}`)}
      className="cursor-pointer rounded-xl shadow-md hover:shadow-xl bg-white overflow-hidden transition"
    >
      <img
        src={product.image}
        alt={product.name}
        className="h-56 w-full object-cover"
      />
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <span className="font-bold">{product.price} €</span>
      </div>
    </div>
  );
}
