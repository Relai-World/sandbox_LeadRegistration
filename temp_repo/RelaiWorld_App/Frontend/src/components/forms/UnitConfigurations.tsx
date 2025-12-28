import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

interface UnitConfigurationsProps {
  data: any;
  onUpdate: (data: any) => void;
  errors?: any;
  isViewMode?: boolean;
  projectType?: string;
}

export const UnitConfigurations: React.FC<UnitConfigurationsProps> = ({ data, onUpdate, errors = {}, isViewMode = false, projectType = '' }) => {
  const isVillaProject = projectType === 'Villa';
  const unitTypes = [
    '1 BHK', 
    '2 BHK', 
    '2.5 BHK', 
    '3 BHK', 
    '3.5 BHK', 
    '4 BHK', 
    '4.5 BHK', 
    '5 BHK', 
    '6 BHK'
  ];  
  const updateUnitData = (unitType: string, newUnitData: any) => {
    onUpdate({
      unitTypes: {
        ...(data.unitTypes || {}),
        [unitType]: newUnitData,
      },
    });
  };

  const handleUnitTypeToggle = (unitType: string, checked: boolean) => {
    const currentUnit = data.unitTypes?.[unitType] || {};
    const initialVariant = isVillaProject 
      ? { sizeSqFt: '', sizeSqYd: '', parkingSlots: '', facing: '', uds: '', configSoldOutStatus: 'active' }
      : { size: '', sizeUnit: 'Sq ft', parkingSlots: '', facing: '', uds: '', configSoldOutStatus: 'active' };
    
    updateUnitData(unitType, {
      ...currentUnit,
      enabled: checked,
      // Initialize with one empty variant row if enabled for the first time
      variants: checked ? (currentUnit.variants && currentUnit.variants.length > 0 ? currentUnit.variants : [initialVariant]) : [],
    });
  };

  const addVariant = (unitType: string) => {
    const currentUnit = data.unitTypes?.[unitType] || { variants: [] };
    const newVariant = isVillaProject 
      ? { sizeSqFt: '', sizeSqYd: '', parkingSlots: '', facing: '', uds: '', configSoldOutStatus: 'active' }
      : { size: '', sizeUnit: 'Sq ft', parkingSlots: '', facing: '', uds: '', configSoldOutStatus: 'active' };
    
    updateUnitData(unitType, {
      ...currentUnit,
      variants: [...(currentUnit.variants || []), newVariant],
    });
  };

  const removeVariant = (unitType: string, index: number) => {
    const currentUnit = data.unitTypes?.[unitType] || { variants: [] };
    updateUnitData(unitType, {
      ...currentUnit,
      variants: currentUnit.variants?.filter((_: any, i: number) => i !== index) || [],
    });
  };

  const updateVariant = (unitType: string, index: number, field: 'size' | 'sizeUnit' | 'sizeSqFt' | 'sizeSqYd' | 'parkingSlots' | 'facing' | 'uds' | 'configSoldOutStatus', value: string) => {
    const currentUnit = data.unitTypes?.[unitType] || { variants: [] };
    
    // Only apply number filtering for size fields, parkingSlots, and uds, not for sizeUnit, facing, or configSoldOutStatus
    const finalValue = (field === 'size' || field === 'sizeSqFt' || field === 'sizeSqYd' || field === 'parkingSlots' || field === 'uds') 
      ? value.replace(/[^0-9.]/g, '') 
      : value;
    
    const updatedVariants = currentUnit.variants?.map((variant: any, i: number) =>
      i === index ? { ...variant, [field]: finalValue } : variant
    ) || [];

    updateUnitData(unitType, { ...currentUnit, variants: updatedVariants });
  };

  return (
    <div className="space-y-6">
      {errors.configurations && <p className="text-red-500 text-sm mb-4">{errors.configurations}</p>}
      {unitTypes.map((unitType) => {
        const unitData = data.unitTypes?.[unitType] || { enabled: false, variants: [] };
        
        console.log(`UnitConfigurations: Processing unit type "${unitType}":`, unitData);
        console.log(`UnitConfigurations: Variants for "${unitType}":`, unitData.variants);
        
        return (
          <Card key={unitType}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`unit-${unitType}`}
                  checked={unitData.enabled}
                  onCheckedChange={(checked) => handleUnitTypeToggle(unitType, checked as boolean)}
                  disabled={isViewMode}
                />
              <Label htmlFor={`unit-${unitType}`} className="text-lg font-medium cursor-pointer">{unitType}</Label>
               </div>
            </CardHeader>
            
            {unitData.enabled && (
              <CardContent>
                {/* Column Headers */}
                {isVillaProject ? (
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 mb-2">
                    <Label className="font-semibold text-gray-700">Size (Sq ft)</Label>
                    <Label className="font-semibold text-gray-700">Size (Sq Yd)</Label>
                    <Label className="font-semibold text-gray-700">Car Parking</Label>
                    <Label className="font-semibold text-gray-700">Facing</Label>
                    <Label className="font-semibold text-gray-700">UDS</Label>
                    <Label className="font-semibold text-gray-700">Config Available</Label>
                    <div></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_auto_1fr_1fr_1fr_1fr_auto] gap-4 mb-2">
                    <Label className="font-semibold text-gray-700">Size Range</Label>
                    <Label className="font-semibold text-gray-700">Size Unit</Label>
                    <Label className="font-semibold text-gray-700">Car Parking</Label>
                    <Label className="font-semibold text-gray-700">Facing</Label>
                    <Label className="font-semibold text-gray-700">UDS</Label>
                    <Label className="font-semibold text-gray-700">Config Available</Label>
                    <div></div>
                  </div>
                )}

                {/* Dynamic Variant Rows */}
                <div className="space-y-3">
                  {(unitData.variants || []).map((variant: any, index: number) => {
                     const variantErrors = errors.configurationDetails?.[unitType]?.[index] || {};
                     console.log(`UnitConfigurations: Variant ${index} for ${unitType}:`, variant, 'UDS value:', variant.uds);
                    return isVillaProject ? (
                      // Villa Project Layout: 2 separate size fields
                      <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                        {/* Column 1: Size in Sq ft */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 1200"
                            value={variant.sizeSqFt || ''}
                            onChange={(e) => updateVariant(unitType, index, 'sizeSqFt', e.target.value)}
                            className={variantErrors.sizeSqFt ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 2: Size in Sq Yd */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 133"
                            value={variant.sizeSqYd || ''}
                            onChange={(e) => updateVariant(unitType, index, 'sizeSqYd', e.target.value)}
                            className={variantErrors.sizeSqYd ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 3: Parking Input */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 1"
                            value={variant.parkingSlots || ''}
                            onChange={(e) => updateVariant(unitType, index, 'parkingSlots', e.target.value)}
                            className={variantErrors.parkingSlots ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 4: Facing Dropdown */}
                        <div>
                          <Select 
                            value={variant.facing || ''} 
                            onValueChange={(value) => updateVariant(unitType, index, 'facing', value)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select facing" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="North">North</SelectItem>
                              <SelectItem value="East">East</SelectItem>
                              <SelectItem value="West">West</SelectItem>
                              <SelectItem value="South">South</SelectItem>
                              <SelectItem value="North-East">North-East</SelectItem>
                              <SelectItem value="North-West">North-West</SelectItem>
                              <SelectItem value="South-East">South-East</SelectItem>
                              <SelectItem value="South-West">South-West</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Column 5: UDS Input */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 500"
                            value={variant.uds !== undefined && variant.uds !== null ? String(variant.uds) : ''}
                            onChange={(e) => updateVariant(unitType, index, 'uds', e.target.value)}
                            className={variantErrors.uds ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 6: Config Available Toggle */}
                        <div className="flex items-center gap-2">
                          <Switch 
                            id={`configSoldOutStatus-villa-${unitType}-${index}`}
                            checked={(variant.configSoldOutStatus || 'active') === 'active'}
                            onCheckedChange={(checked) => updateVariant(unitType, index, 'configSoldOutStatus', checked ? 'active' : 'soldout')}
                            disabled={isViewMode}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {(variant.configSoldOutStatus || 'active') === 'active' ? 'Active' : 'Sold Out'}
                          </span>
                        </div>
                        
                        {/* Column 7: Delete Button */}
                        {(unitData.variants || []).length > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeVariant(unitType, index)}
                            disabled={isViewMode}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="w-10 h-10"></div>
                        )}
                      </div>
                    ) : (
                      // Non-Villa Project Layout: Original single size field with unit dropdown
                      <div key={index} className="grid grid-cols-[1fr_auto_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                        {/* Column 1: Size Input */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 1200"
                            value={variant.size || ''}
                            onChange={(e) => updateVariant(unitType, index, 'size', e.target.value)}
                            className={variantErrors.size ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 2: Size Unit Dropdown */}
                        <div>
                          <Select 
                            value={variant.sizeUnit || 'Sq ft'} 
                            onValueChange={(value) => updateVariant(unitType, index, 'sizeUnit', value)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sq ft">Sq ft</SelectItem>
                              <SelectItem value="Sq Yd">Sq Yd</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Column 3: Parking Input */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 1"
                            value={variant.parkingSlots || ''}
                            onChange={(e) => updateVariant(unitType, index, 'parkingSlots', e.target.value)}
                            className={variantErrors.parkingSlots ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 4: Facing Dropdown */}
                        <div>
                          <Select 
                            value={variant.facing || ''} 
                            onValueChange={(value) => updateVariant(unitType, index, 'facing', value)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select facing" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="North">North</SelectItem>
                              <SelectItem value="East">East</SelectItem>
                              <SelectItem value="West">West</SelectItem>
                              <SelectItem value="South">South</SelectItem>
                              <SelectItem value="North-East">North-East</SelectItem>
                              <SelectItem value="North-West">North-West</SelectItem>
                              <SelectItem value="South-East">South-East</SelectItem>
                              <SelectItem value="South-West">South-West</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Column 5: UDS Input */}
                        <div>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g., 500"
                            value={variant.uds !== undefined && variant.uds !== null ? String(variant.uds) : ''}
                            onChange={(e) => updateVariant(unitType, index, 'uds', e.target.value)}
                            className={variantErrors.uds ? 'border-red-500' : ''}
                            disabled={isViewMode}
                          />
                        </div>
                        
                        {/* Column 6: Config Available Toggle */}
                        <div className="flex items-center gap-2">
                          <Switch 
                            id={`configSoldOutStatus-${unitType}-${index}`}
                            checked={(variant.configSoldOutStatus || 'active') === 'active'}
                            onCheckedChange={(checked) => updateVariant(unitType, index, 'configSoldOutStatus', checked ? 'active' : 'soldout')}
                            disabled={isViewMode}
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {(variant.configSoldOutStatus || 'active') === 'active' ? 'Active' : 'Sold Out'}
                          </span>
                        </div>
                        
                        {/* Column 7: Delete Button */}
                        {(unitData.variants || []).length > 1 ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeVariant(unitType, index)}
                            disabled={isViewMode}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <div className="w-10 h-10"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Single Add Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addVariant(unitType)}
                  className="w-full mt-4 flex items-center gap-2"
                  disabled={isViewMode}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};