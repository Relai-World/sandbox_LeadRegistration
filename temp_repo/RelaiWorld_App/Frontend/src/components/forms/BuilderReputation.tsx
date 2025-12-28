import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface BuilderReputationProps {
  data: any;
  onUpdate: (data: any) => void;
  errors?: any;
  isViewMode?: boolean;
}

export const BuilderReputation: React.FC<BuilderReputationProps> = ({ data, onUpdate, errors = {}, isViewMode = false }) => {
  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleAddLocation = () => {
    const currentLocations = data.builderOperatingLocations || [];
    onUpdate({ builderOperatingLocations: [...currentLocations, ''] });
  };

  const handleRemoveLocation = (index: number) => {
    const currentLocations = data.builderOperatingLocations || [];
    onUpdate({ builderOperatingLocations: currentLocations.filter((_: string, i: number) => i !== index) });
  };

  const handleLocationChange = (index: number, value: string) => {
    const currentLocations = data.builderOperatingLocations || [];
    const updatedLocations = currentLocations.map((loc: string, i: number) => 
      i === index ? value : loc
    );
    onUpdate({ builderOperatingLocations: updatedLocations });
  };

  React.useEffect(() => {
    if (!data.builderOperatingLocations || data.builderOperatingLocations.length === 0) {
      onUpdate({ builderOperatingLocations: [''] });
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Builder Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="builderAge">Builder Age (years)</Label>
            <Input
              id="builderAge"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 15"
              value={data.builderAge || ''}
              onChange={(e) => handleInputChange('builderAge', e.target.value)}
              className={errors.builderAge ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.builderAge && <p className="text-red-500 text-xs mt-1">{errors.builderAge}</p>}
            <p className="text-xs text-gray-500">Years since the builder company was established</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="builderOriginCity">Origin City</Label>
            <Input
              id="builderOriginCity"
              type="text"
              placeholder="e.g., Hyderabad"
              value={data.builderOriginCity || ''}
              onChange={(e) => handleInputChange('builderOriginCity', e.target.value)}
              className={errors.builderOriginCity ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.builderOriginCity && <p className="text-red-500 text-xs mt-1">{errors.builderOriginCity}</p>}
            <p className="text-xs text-gray-500">City where the builder company was founded</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Builder Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="builderTotalProperties">Total Properties</Label>
            <Input
              id="builderTotalProperties"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 50"
              value={data.builderTotalProperties || ''}
              onChange={(e) => handleInputChange('builderTotalProperties', e.target.value)}
              className={errors.builderTotalProperties ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.builderTotalProperties && <p className="text-red-500 text-xs mt-1">{errors.builderTotalProperties}</p>}
            <p className="text-xs text-gray-500">Total number of properties developed</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="builderCompletedProperties">Completed Properties</Label>
            <Input
              id="builderCompletedProperties"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 35"
              value={data.builderCompletedProperties || ''}
              onChange={(e) => handleInputChange('builderCompletedProperties', e.target.value)}
              className={errors.builderCompletedProperties ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.builderCompletedProperties && <p className="text-red-500 text-xs mt-1">{errors.builderCompletedProperties}</p>}
            <p className="text-xs text-gray-500">Properties that have been completed</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="builderOngoingProjects">Ongoing Projects</Label>
            <Input
              id="builderOngoingProjects"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 10"
              value={data.builderOngoingProjects || ''}
              onChange={(e) => handleInputChange('builderOngoingProjects', e.target.value)}
              className={errors.builderOngoingProjects ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.builderOngoingProjects && <p className="text-red-500 text-xs mt-1">{errors.builderOngoingProjects}</p>}
            <p className="text-xs text-gray-500">Projects currently under construction</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="builderUpcomingProperties">Upcoming Properties</Label>
            <Input
              id="builderUpcomingProperties"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 5"
              value={data.builderUpcomingProperties || ''}
              onChange={(e) => handleInputChange('builderUpcomingProperties', e.target.value)}
              className={errors.builderUpcomingProperties ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.builderUpcomingProperties && <p className="text-red-500 text-xs mt-1">{errors.builderUpcomingProperties}</p>}
            <p className="text-xs text-gray-500">Properties planned for future development</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Operating Locations</CardTitle>
          {!isViewMode && (
            <Button type="button" onClick={handleAddLocation} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Location
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">Cities where the builder operates</p>
          {(data.builderOperatingLocations || ['']).map((location: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`Location ${index + 1} (e.g., Bangalore)`}
                value={location}
                onChange={(e) => handleLocationChange(index, e.target.value)}
                disabled={isViewMode}
                className="flex-1"
              />
              {!isViewMode && (data.builderOperatingLocations || []).length > 1 && (
                <Button
                  type="button"
                  onClick={() => handleRemoveLocation(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
