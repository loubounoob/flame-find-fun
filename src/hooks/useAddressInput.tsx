import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

interface UseAddressInputProps {
  placeholder?: string;
  className?: string;
}

export function useAddressInput({ placeholder = "Saisissez une adresse...", className }: UseAddressInputProps = {}) {
  const [value, setValue] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const handleAddressSelect = (address: string, location: { lat: number; lng: number }) => {
    setValue(address);
    setCoordinates(location);
  };

  const AddressInput = () => (
    <AddressAutocomplete
      value={value}
      onChange={setValue}
      onAddressSelect={handleAddressSelect}
      placeholder={placeholder}
      className={className}
    />
  );

  return {
    value,
    setValue,
    coordinates,
    setCoordinates,
    AddressInput
  };
}