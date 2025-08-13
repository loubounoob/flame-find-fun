import { AddressAutocomplete } from "./AddressAutocomplete";

interface GlobalAddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: string, location: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

export function GlobalAddressInput({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Saisissez une adresse...",
  className
}: GlobalAddressInputProps) {
  return (
    <AddressAutocomplete
      value={value}
      onChange={onChange}
      onAddressSelect={onAddressSelect}
      placeholder={placeholder}
      className={className}
    />
  );
}