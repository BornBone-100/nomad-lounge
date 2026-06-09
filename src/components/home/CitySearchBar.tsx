"use client";

import { Search, X } from "lucide-react";

interface CitySearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function CitySearchBar({ value, onChange }: CitySearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="도시 검색 (예: 방콕, Tokyo)"
        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm outline-none
          focus:border-primary focus:bg-white focus:shadow-sm focus:shadow-primary/10 transition-all
          placeholder:text-gray-300"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
