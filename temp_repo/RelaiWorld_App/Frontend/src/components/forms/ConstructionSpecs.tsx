import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { sqmtToAcres, sqmtToSqft } from '@/lib/utils';

interface ConstructionSpecsProps {
  data: any;
  onUpdate: (data: any) => void;
  errors?: any;
  isViewMode?: boolean;
  reraNumber?: string;
}

export const ConstructionSpecs: React.FC<ConstructionSpecsProps> = ({ data, onUpdate, errors = {}, isViewMode = false, reraNumber = '' }) => {
  // Check if RERA Number starts with 'PRM/KA/RERA/'
  const isPRMKARERA = useMemo(() => {
    return (reraNumber || '').startsWith('PRM/KA/RERA/');
  }, [reraNumber]);

  const handleInputChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  // Handle Total Buildup Area input - convert from sqmt to sqft if PRM/KA/RERA/
  const handleTotalBuildupAreaChange = (value: string) => {
    if (isPRMKARERA) {
      // Store the raw input value for display (allows user to type freely)
      // Extract numeric value for conversion
      const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      
      if (value === '') {
        // Clear both values when input is empty
        onUpdate({ 
          totalBuildupArea: '',
          totalBuildupAreaSqmt: ''
        });
      } else if (!isNaN(numericValue) && numericValue > 0) {
        // Valid number - convert to sqft and store both values
        const sqft = sqmtToSqft(numericValue);
        onUpdate({ 
          totalBuildupArea: sqft.toFixed(2), // Store converted sqft value
          totalBuildupAreaSqmt: value // Store original input (may include "sqmt" text)
        });
      } else {
        // Partial input (e.g., user typing "2" or "25")
        // Store the input as-is for display, but don't convert yet
        onUpdate({ 
          totalBuildupArea: '',
          totalBuildupAreaSqmt: value
        });
      }
    } else {
      onUpdate({ totalBuildupArea: value });
    }
  };

  const amenitiesList = [
    'Swimming Pool',
    'Gymnasium',
    'Clubhouse',
    'Children\'s Play Area',
    'Landscaped Gardens',
    'Jogging Track',
    'Tennis Court',
    'Basketball Court',
    'Security System',
    'Power Backup',
    'Rainwater Harvesting'
  ];

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const currentAmenities = data.amenities || [];
    let updatedAmenities;
    
    if (checked) {
      updatedAmenities = [...currentAmenities, amenity];
    } else {
      updatedAmenities = currentAmenities.filter((item: string) => item !== amenity);
    }
    
    onUpdate({ amenities: updatedAmenities });
  };

  const handleSelectAllAmenities = (checked: boolean) => {
    if (checked) {
      onUpdate({ amenities: [...amenitiesList] });
    } else {
      onUpdate({ amenities: [] });
    }
  };

  const selectedAmenitiesCount = data.amenities?.length || 0;
  const allAmenitiesSelected = selectedAmenitiesCount === amenitiesList.length;
  const someAmenitiesSelected = selectedAmenitiesCount > 0 && !allAmenitiesSelected;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Construction Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priceSheetLink">Price Sheet Link</Label>
            <Input
              id="priceSheetLink"
              type="text"
              placeholder="e.g., https://..."
              value={data.priceSheetLink || ''}
              onChange={(e) => handleInputChange('priceSheetLink', e.target.value)}
              className={errors.priceSheetLink ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.priceSheetLink && <p className="text-red-500 text-xs mt-1">{errors.priceSheetLink}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brochureLink">Brochure Link</Label>
            <Input
              id="brochureLink"
              type="text"
              placeholder="e.g., https://..."
              value={data.brochureLink || ''}
              onChange={(e) => handleInputChange('brochureLink', e.target.value)}
              className={errors.brochureLink ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.brochureLink && <p className="text-red-500 text-xs mt-1">{errors.brochureLink}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="totalBuildupArea">
              Total Buildup Area {isPRMKARERA ? '(sqmt)' : ''}
              {isPRMKARERA && data.totalBuildupArea && (
                <span className="text-xs text-gray-500 ml-2">
                  ({parseFloat(data.totalBuildupArea).toFixed(2)} sqft)
                </span>
              )}
            </Label>
            <Input
              id="totalBuildupArea"
              type="text"
              placeholder={isPRMKARERA ? "e.g., 500000 sqmt" : "e.g., 500000 sq ft"}
              value={isPRMKARERA ? (data.totalBuildupAreaSqmt || '') : (data.totalBuildupArea || '')}
              onChange={(e) => isPRMKARERA ? handleTotalBuildupAreaChange(e.target.value) : handleInputChange('totalBuildupArea', e.target.value)}
              className={errors.totalBuildupArea ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.totalBuildupArea && <p className="text-red-500 text-xs mt-1">{errors.totalBuildupArea}</p>}
          </div>
          
          {/* <div className="space-y-2">
            <Label htmlFor="uds">UDS (Undivided Share)</Label>
            <Input
              id="uds"
              type="text"
              placeholder="e.g., 1200 sq ft"
              value={data.uds || ''}
              onChange={(e) => handleInputChange('uds', e.target.value)}
              className={errors.uds ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.uds && <p className="text-red-500 text-xs mt-1">{errors.uds}</p>}
          </div> */}
          
          <div className="space-y-2">
            <Label htmlFor="fsi">FSI (Floor Space Index)</Label>
            <Input
              id="fsi"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 2.5"
              value={data.fsi || ''}
              onChange={(e) => handleInputChange('fsi', e.target.value)}
              className={errors.fsi ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.fsi && <p className="text-red-500 text-xs mt-1">{errors.fsi}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carpetAreaPercentage">Carpet Area Percentage</Label>
            <Input
              id="carpetAreaPercentage"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 75"
              value={data.carpetAreaPercentage || ''}
              onChange={(e) => handleInputChange('carpetAreaPercentage', e.target.value)}
              className={errors.carpetAreaPercentage ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.carpetAreaPercentage && <p className="text-red-500 text-xs mt-1">{errors.carpetAreaPercentage}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ceilingHeight">Floor to Ceiling Height (ft)</Label>
            <Input
              id="ceilingHeight"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 10"
              value={data.ceilingHeight || ''}
              onChange={(e) => handleInputChange('ceilingHeight', e.target.value)}
              className={errors.ceilingHeight ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.ceilingHeight && <p className="text-red-500 text-xs mt-1">{errors.ceilingHeight}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mainDoorHeight">Main Door Height (ft)</Label>
            <Input
              id="mainDoorHeight"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 7"
              value={data.mainDoorHeight || ''}
              onChange={(e) => handleInputChange('mainDoorHeight', e.target.value)}
              className={errors.mainDoorHeight ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.mainDoorHeight && <p className="text-red-500 text-xs mt-1">{errors.mainDoorHeight}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pricePerSft">Price per Sq Ft</Label>
            <Input
              id="pricePerSft"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 8000"
              value={data.pricePerSft || ''}
              onChange={(e) => handleInputChange('pricePerSft', e.target.value)}
              className={errors.pricePerSft ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.pricePerSft && <p className="text-red-500 text-xs mt-1">{errors.pricePerSft}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="powerBackup">Power Backup</Label>
            <Select onValueChange={(value) => handleInputChange('powerBackup', value)} value={data.powerBackup || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.powerBackup ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select power backup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full">Full</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="None">None</SelectItem>
              </SelectContent>
            </Select>
            {errors.powerBackup && <p className="text-red-500 text-xs mt-1">{errors.powerBackup}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="passengerLifts">Number of Passenger Lifts</Label>
            <Input
              id="passengerLifts"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 4"
              value={data.passengerLifts || ''}
              onChange={(e) => handleInputChange('passengerLifts', e.target.value)}
              className={errors.passengerLifts ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.passengerLifts && <p className="text-red-500 text-xs mt-1">{errors.passengerLifts}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="serviceLifts">Number of Service Lifts</Label>
            <Input
              id="serviceLifts"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 1"
              value={data.serviceLifts || ''}
              onChange={(e) => handleInputChange('serviceLifts', e.target.value)}
              className={errors.serviceLifts ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.serviceLifts && <p className="text-red-500 text-xs mt-1">{errors.serviceLifts}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features & Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="visitorParking">Visitor Parking</Label>
            <Select onValueChange={(value) => handleInputChange('visitorParking', value)} value={data.visitorParking || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.visitorParking ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select visitor parking" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {errors.visitorParking && <p className="text-red-500 text-xs mt-1">{errors.visitorParking}</p>}
          </div>
          
          <div className="space-y-3">
            <Label>Amenities</Label>
            <div className="flex items-center space-x-3 p-2 border rounded-md">
              <Checkbox
                id="select-all-amenities"
                checked={allAmenitiesSelected ? true : someAmenitiesSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => handleSelectAllAmenities(checked as boolean)}
                disabled={isViewMode}
              />
              <Label htmlFor="select-all-amenities" className="font-medium cursor-pointer">
                Select All
              </Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {amenitiesList.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={data.amenities?.includes(amenity) || false}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    disabled={isViewMode}
                  />
                  <Label htmlFor={amenity} className="text-sm font-normal cursor-pointer">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="groundVehicleMovement">Ground Vehicle Movement</Label>
            <Select onValueChange={(value) => handleInputChange('groundVehicleMovement', value)} value={data.groundVehicleMovement || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.groundVehicleMovement ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select vehicle movement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
            {errors.groundVehicleMovement && <p className="text-red-500 text-xs mt-1">{errors.groundVehicleMovement}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="constructionMaterial">Construction Material</Label>
            <Select onValueChange={(value) => handleInputChange('constructionMaterial', value)} value={data.constructionMaterial || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.constructionMaterial ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Concrete">Concrete</SelectItem>
                <SelectItem value="Red Bricks">Red Bricks</SelectItem>
                <SelectItem value="Cement Bricks">Cement Bricks</SelectItem>
              </SelectContent>
            </Select>
            {errors.constructionMaterial && <p className="text-red-500 text-xs mt-1">{errors.constructionMaterial}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="externalAmenities">External Amenities</Label>
            <Textarea
              id="externalAmenities"
              placeholder="e.g., Clubhouse, Swimming Pool, Gym..."
              value={data.externalAmenities || ''}
              onChange={(e) => handleInputChange('externalAmenities', e.target.value)}
              className={errors.externalAmenities ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.externalAmenities && <p className="text-red-500 text-xs mt-1">{errors.externalAmenities}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="specifications">Specifications</Label>
            <Textarea
              id="specifications"
              placeholder="Detail any specific features or materials..."
              value={data.specifications || ''}
              onChange={(e) => handleInputChange('specifications', e.target.value)}
              className={errors.specifications ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.specifications && <p className="text-red-500 text-xs mt-1">{errors.specifications}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing & Charges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floorRiseCharges">Floor Rise Charges</Label>
              <Select onValueChange={(value) => handleInputChange('floorRiseCharges', value)} value={data.floorRiseCharges || ''} disabled={isViewMode}>
                <SelectTrigger className={errors.floorRiseCharges ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.floorRiseCharges && <p className="text-red-500 text-xs mt-1">{errors.floorRiseCharges}</p>}
            </div>
            
            {data.floorRiseCharges === 'yes' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="floorRiseAmountPerFloor">Amount per Floor (₹)</Label>
                  <Input
                    id="floorRiseAmountPerFloor"
                    type="number"
                    step="any"
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="e.g., 50000"
                    value={data.floorRiseAmountPerFloor || ''}
                    onChange={(e) => handleInputChange('floorRiseAmountPerFloor', e.target.value)}
                    className={errors.floorRiseAmountPerFloor ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {errors.floorRiseAmountPerFloor && <p className="text-red-500 text-xs mt-1">{errors.floorRiseAmountPerFloor}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="floorRiseApplicableAboveFloorNo">Applicable Above Floor No.</Label>
                  <Input
                    id="floorRiseApplicableAboveFloorNo"
                    type="number"
                    step="any"
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="e.g., 5"
                    value={data.floorRiseApplicableAboveFloorNo || ''}
                    onChange={(e) => handleInputChange('floorRiseApplicableAboveFloorNo', e.target.value)}
                    className={errors.floorRiseApplicableAboveFloorNo ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {errors.floorRiseApplicableAboveFloorNo && <p className="text-red-500 text-xs mt-1">{errors.floorRiseApplicableAboveFloorNo}</p>}
                </div>
              </>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facingCharges">Facing Charges</Label>
              <Select onValueChange={(value) => handleInputChange('facingCharges', value)} value={data.facingCharges || ''} disabled={isViewMode}>
                <SelectTrigger className={errors.facingCharges ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.facingCharges && <p className="text-red-500 text-xs mt-1">{errors.facingCharges}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preferentialLocationCharges">Preferential Location Charges</Label>
              <Select onValueChange={(value) => handleInputChange('preferentialLocationCharges', value)} value={data.preferentialLocationCharges || ''} disabled={isViewMode}>
                <SelectTrigger className={errors.preferentialLocationCharges ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.preferentialLocationCharges && <p className="text-red-500 text-xs mt-1">{errors.preferentialLocationCharges}</p>}
            </div>
          </div>
          
          {data.preferentialLocationCharges === 'yes' && (
            <div className="space-y-2">
              <Label htmlFor="preferentialLocationChargesConditions">Preferential Location Charges Conditions</Label>
              <Textarea
                id="preferentialLocationChargesConditions"
                placeholder="Specify applicable units or conditions..."
                value={data.preferentialLocationChargesConditions || ''}
                onChange={(e) => handleInputChange('preferentialLocationChargesConditions', e.target.value)}
                className={errors.preferentialLocationChargesConditions ? 'border-red-500' : ''}
                disabled={isViewMode}
              />
              {errors.preferentialLocationChargesConditions && <p className="text-red-500 text-xs mt-1">{errors.preferentialLocationChargesConditions}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};