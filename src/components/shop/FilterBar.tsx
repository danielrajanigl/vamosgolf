"use client";
interface FilterBarProps {
  filter: string;
  onChange: (v: string) => void;
  categories: string[];
}

export function FilterBar({ filter, onChange, categories }: FilterBarProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
            filter === cat
              ? "bg-sky-500 text-white border-sky-500 shadow-sm"
              : "bg-white text-gray-700 hover:bg-sky-50 border-gray-200 hover:border-sky-300"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
