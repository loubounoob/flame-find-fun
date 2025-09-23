import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  isVisible: boolean;
}

export function SearchSuggestions({ query, onSelect, isVisible }: SearchSuggestionsProps) {
  const navigate = useNavigate();

  const { data: suggestions = [] } = useQuery({
    queryKey: ["searchSuggestions", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const { data: offers, error } = await supabase
        .from("offers")
        .select("id, title, category, location")
        .eq("status", "active")
        .or(`title.ilike.%${query}%,category.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(8);
      
      if (error) throw error;
      
      // Create unique suggestions combining titles, categories, and locations
      const titleSuggestions = offers.map(offer => ({
        type: "title" as const,
        value: offer.title,
        id: offer.id,
        category: offer.category
      }));
      
      const categorySuggestions = [...new Set(offers.map(offer => offer.category))]
        .map(category => ({
          type: "category" as const,
          value: category,
          id: null,
          category: null
        }));
      
      const locationSuggestions = [...new Set(offers.map(offer => offer.location))]
        .map(location => ({
          type: "location" as const,
          value: location,
          id: null,
          category: null
        }));
      
      return [...titleSuggestions, ...categorySuggestions, ...locationSuggestions].slice(0, 6);
    },
    enabled: query.length >= 2,
  });

  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.type === "title" && suggestion.id) {
      navigate(`/offer/${suggestion.id}`);
    } else {
      onSelect(suggestion.value);
    }
  };

  if (!isVisible || !query || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border/50 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.type}-${suggestion.value}-${index}`}
          onClick={() => handleSuggestionClick(suggestion)}
          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
        >
          {suggestion.type === "title" && <Search size={14} className="text-primary" />}
          {suggestion.type === "category" && <Tag size={14} className="text-orange-500" />}
          {suggestion.type === "location" && <MapPin size={14} className="text-green-500" />}
          
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">
              {suggestion.value}
            </div>
            {suggestion.type === "title" && suggestion.category && (
              <div className="text-xs text-muted-foreground">
                {suggestion.category}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}