import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RouteClearButtonProps {
  onClear: () => void;
  disabled?: boolean;
}

export const RouteClearButton = ({ onClear, disabled }: RouteClearButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        console.log('Clear Route button clicked');
        onClear();
      }}
      disabled={disabled}
      className="text-orange-600 border-orange-300 hover:bg-orange-50"
    >
      <X className="w-4 h-4 mr-1" />
      Clear Route
    </Button>
  );
};