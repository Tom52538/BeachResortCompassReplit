import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Site, TEST_SITES } from '@/types/navigation';
import { useLanguage } from '@/hooks/useLanguage';

interface PermanentHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  currentSite: Site;
  onSiteChange: (site: Site) => void;
  showClearButton?: boolean;
  onClear?: () => void;
}

export const PermanentHeader = ({
  searchQuery,
  onSearch,
  currentSite,
  onSiteChange,
  showClearButton = false,
  onClear
}: PermanentHeaderProps) => {
  const { t } = useLanguage();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  // Site options for dropdown
  const siteOptions = [
    { key: 'kamperland' as Site, name: 'Kamperland', icon: '🏕️' },
    { key: 'zuhause' as Site, name: 'Zuhause', icon: '🏠' },
    { key: 'sittard' as Site, name: 'Sittard', icon: '🏛️' }
  ];

  const currentSiteInfo = siteOptions.find(option => option.key === currentSite);

  const handleSiteSelect = (site: Site) => {
    onSiteChange(site);
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40"
         style={{
           background: 'rgba(255, 255, 255, 0.7)',
           backdropFilter: 'blur(6px)',
           borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
           boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)'
         }}>
      <div className="flex items-center justify-between px-4 py-3 h-16">
        {/* Search Bar - Takes up most space */}
        <div className="flex-1 mr-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={handleInputChange}
              className="pl-10 pr-4 py-2 w-full border border-white/20 rounded-full 
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder:text-gray-500 text-gray-900"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(6px)'
              }}
            />
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {/* Clear Button */}
          {showClearButton && onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-xs px-3 h-8 text-gray-600 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              Clear
            </Button>
          )}

          {/* Site Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 border border-white/20 rounded-full
                           flex items-center space-x-1 min-w-[100px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(6px)'
                }}
              >
                <span className="text-xs">{currentSiteInfo?.icon}</span>
                <span className="text-xs font-medium text-gray-800">
                  {currentSiteInfo?.name}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="min-w-[140px] bg-white/95 backdrop-blur-md border border-white/20"
            >
              {siteOptions.map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() => handleSiteSelect(option.key)}
                  className={`flex items-center space-x-2 cursor-pointer
                             ${currentSite === option.key ? 'bg-blue-50' : ''}`}
                >
                  <span className="text-sm">{option.icon}</span>
                  <span className="text-sm font-medium">{option.name}</span>
                  {currentSite === option.key && (
                    <MapPin className="w-3 h-3 text-blue-600 ml-auto" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      
    </div>
  );
};