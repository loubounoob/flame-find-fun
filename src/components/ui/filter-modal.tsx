import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./dialog";
import { Button } from "./button";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Badge } from "./badge";
import { Slider } from "./slider";
import { Filter, MapPin, Euro, Clock, Users } from "lucide-react";

interface FilterModalProps {
  onFiltersChange: (filters: any) => void;
  currentFilters: any;
}

export function FilterModal({ onFiltersChange, currentFilters }: FilterModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: currentFilters.category || "all",
    maxDistance: currentFilters.maxDistance || [10],
    priceRange: currentFilters.priceRange || [0, 100],
    participants: currentFilters.participants || "all",
    timeSlot: currentFilters.timeSlot || "all",
    ...currentFilters
  });

  const categories = [
    "Tous",
    "Bowling", 
    "Laser Game",
    "Karaoké",
    "Escape Game",
    "Billard",
    "Sport",
    "Cuisine",
    "Art & Culture",
    "Aventure"
  ];

  const handleApplyFilters = () => {
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const defaultFilters = {
      category: "all",
      maxDistance: [10],
      priceRange: [0, 100],
      participants: "all",
      timeSlot: "all"
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter size={16} className="mr-1" />
          Filtrer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtrer les activités
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Catégorie */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit">
                Catégorie
              </Badge>
            </Label>
            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.slice(1).map((category) => (
                  <SelectItem key={category} value={category.toLowerCase()}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Distance */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin size={14} />
              Distance maximale: {filters.maxDistance[0]}km
            </Label>
            <Slider
              value={filters.maxDistance}
              onValueChange={(value) => setFilters({...filters, maxDistance: value})}
              max={25}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          {/* Prix */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Euro size={14} />
              Fourchette de prix: {filters.priceRange[0]}€ - {filters.priceRange[1]}€
            </Label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters({...filters, priceRange: value})}
              max={200}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          {/* Nombre de participants */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users size={14} />
              Participants
            </Label>
            <Select value={filters.participants} onValueChange={(value) => setFilters({...filters, participants: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Nombre de participants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Peu importe</SelectItem>
                <SelectItem value="1-2">1-2 personnes</SelectItem>
                <SelectItem value="3-5">3-5 personnes</SelectItem>
                <SelectItem value="6-10">6-10 personnes</SelectItem>
                <SelectItem value="10+">10+ personnes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Créneaux horaires */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock size={14} />
              Créneaux
            </Label>
            <Select value={filters.timeSlot} onValueChange={(value) => setFilters({...filters, timeSlot: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un créneau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les créneaux</SelectItem>
                <SelectItem value="morning">Matin (8h-12h)</SelectItem>
                <SelectItem value="afternoon">Après-midi (12h-18h)</SelectItem>
                <SelectItem value="evening">Soirée (18h-23h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={resetFilters} className="flex-1">
              Réinitialiser
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1 bg-gradient-primary">
              Appliquer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}