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
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            filter === cat
              ? "bg-green-700 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
