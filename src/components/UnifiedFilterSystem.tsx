import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter, 
  Search, 
  X,
  MapPin,
  Euro,
  Users,
  Star,
  Clock
} from "lucide-react";

interface UnifiedFilters {
  search: string;
  category: string;
  maxDistance: number;
  priceRange: [number, number];
  rating: number;
  openNow: boolean;
  hasPromotion: boolean;
  participants: number;
  timeSlot: string;
}

interface UnifiedFilterSystemProps {
  onFiltersChange: (filters: UnifiedFilters) => void;
  showQuickCategories?: boolean;
  showAdvancedToggle?: boolean;
}

const DEFAULT_FILTERS: UnifiedFilters = {
  search: "",
  category: "all",
  maxDistance: 10,
  priceRange: [0, 200],
  rating: 0,
  openNow: false,
  hasPromotion: false,
  participants: 1,
  timeSlot: "all"
};

const CATEGORIES = [
  { id: "all", label: "Tous" },
  { id: "bowling", label: "Bowling" },
  { id: "billard", label: "Billard" },
  { id: "padel", label: "Padel" },
  { id: "escape-game", label: "Escape Game" },
  { id: "karting", label: "Karting" },
  { id: "laser-game", label: "Laser Game" },
  { id: "paintball", label: "Paintball" },
  { id: "tennis", label: "Tennis" },
  { id: "badminton", label: "Badminton" },
  { id: "squash", label: "Squash" },
  { id: "cinema", label: "Cinéma" },
  { id: "restaurant", label: "Restaurant" },
  { id: "bar", label: "Bar" }
];

export function UnifiedFilterSystem({ 
  onFiltersChange, 
  showQuickCategories = true,
  showAdvancedToggle = true 
}: UnifiedFilterSystemProps) {
  const [filters, setFilters] = useState<UnifiedFilters>(DEFAULT_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Update filters whenever internal state changes
  useEffect(() => {
    onFiltersChange(filters);
    
    // Count active filters
    let count = 0;
    if (filters.search) count++;
    if (filters.category !== "all") count++;
    if (filters.maxDistance < 50) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 500) count++;
    if (filters.rating > 0) count++;
    if (filters.openNow) count++;
    if (filters.hasPromotion) count++;
    if (filters.participants > 1) count++;
    if (filters.timeSlot !== "all") count++;
    
    setActiveFiltersCount(count);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof UnifiedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Rechercher une activité, entreprise..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick Category Filter */}
      {showQuickCategories && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(category => (
            <Button
              key={category.id}
              variant={filters.category === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('category', category.id)}
              className="whitespace-nowrap"
            >
              {category.label}
            </Button>
          ))}
        </div>
      )}

      {/* Advanced Filters Toggle */}
      {showAdvancedToggle && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="gap-2"
          >
            <Filter size={16} />
            Filtres avancés
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="gap-1 text-muted-foreground"
            >
              <X size={14} />
              Effacer
            </Button>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="p-4 space-y-6">
            {/* Category Select (if quick categories not shown) */}
            {!showQuickCategories && (
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Distance */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin size={14} />
                Distance maximale: {filters.maxDistance}km
              </Label>
              <Slider
                value={[filters.maxDistance]}
                onValueChange={(value) => updateFilter('maxDistance', value[0])}
                max={50}
                step={1}
              />
            </div>

            {/* Price Range */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Euro size={14} />
                Prix: {filters.priceRange[0]}€ - {filters.priceRange[1]}€
              </Label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                max={500}
                step={10}
              />
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Star size={14} />
                Note minimum: {filters.rating} étoile{filters.rating > 1 ? 's' : ''}
              </Label>
              <Slider
                value={[filters.rating]}
                onValueChange={(value) => updateFilter('rating', value[0])}
                max={5}
                step={0.5}
              />
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Users size={14} />
                Participants: {filters.participants}
              </Label>
              <Slider
                value={[filters.participants]}
                onValueChange={(value) => updateFilter('participants', value[0])}
                max={20}
                step={1}
                min={1}
              />
            </div>

            {/* Time Slots */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock size={14} />
                Créneaux horaires
              </Label>
              <Select value={filters.timeSlot} onValueChange={(value) => updateFilter('timeSlot', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les créneaux</SelectItem>
                  <SelectItem value="morning">Matin (8h-12h)</SelectItem>
                  <SelectItem value="afternoon">Après-midi (12h-18h)</SelectItem>
                  <SelectItem value="evening">Soirée (18h-23h)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ouvert maintenant</Label>
                <Switch 
                  checked={filters.openNow}
                  onCheckedChange={(checked) => updateFilter('openNow', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Avec promotions</Label>
                <Switch 
                  checked={filters.hasPromotion}
                  onCheckedChange={(checked) => updateFilter('hasPromotion', checked)}
                />
              </div>
            </div>

            {/* Results summary */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground text-center">
                {activeFiltersCount > 0 
                  ? `${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''}`
                  : 'Aucun filtre appliqué'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}