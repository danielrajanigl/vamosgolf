"use client";
import { useRouter } from "next/navigation";
import { MapPin, Calendar, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: {
    id: string;
    slug?: string;
    name: string;
    description: string;
    price: string;
    priceCents?: number;
    image: string;
    category?: string;
    availableDates?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const handleClick = () => {
    if (product.slug) {
      router.push(`/shop/${product.slug}`);
    } else {
      router.push(`/shop/${product.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-3xl shadow-md hover:shadow-xl bg-white overflow-hidden transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
    >
      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-sky-50 to-blue-50">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            // Fallback zu verschiedenen Golfplatz-Bildern
            const fallbackImages = [
              'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80', // Golfplatz mit grünen Greens
              'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80', // Golfplatz am Meer
              'https://images.unsplash.com/photo-1587174486073-ae5e5fcfb33b?w=800&q=80', // Golfplatz mit Palmen
            ];
            const currentSrc = e.currentTarget.src;
            const currentIndex = fallbackImages.findIndex(img => currentSrc.includes(img.split('?')[0]));
            const nextIndex = (currentIndex + 1) % fallbackImages.length;
            e.currentTarget.src = fallbackImages[nextIndex];
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        
        {/* Badge - Leicht und luftig */}
        {product.availableDates !== undefined && product.availableDates > 0 && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-sky-700 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
            {product.availableDates} Termin{product.availableDates !== 1 ? 'e' : ''}
          </div>
        )}
      </div>
      
      <div className="p-6 bg-white">
        <h2 className="text-2xl font-bold mb-3 text-gray-900 group-hover:text-sky-600 transition-colors">
          {product.name}
        </h2>
        <p className="text-gray-600 text-sm mb-5 line-clamp-2 leading-relaxed">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          <div>
            <div className="text-3xl font-bold text-sky-600">
              {product.price} <span className="text-lg font-normal text-gray-500">€</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">ab pro Person</div>
          </div>
          <Button 
            className="bg-sky-500 hover:bg-sky-600 text-white group-hover:translate-x-1 transition-all shadow-sm"
            size="sm"
          >
            Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
