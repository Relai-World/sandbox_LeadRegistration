import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FinancialComplianceProps {
  data: any;
  onUpdate: (data: any) => void;
  errors?: any;
  isViewMode?: boolean;
}

export const FinancialCompliance: React.FC<FinancialComplianceProps> = ({ data, onUpdate, errors = {}, isViewMode = false }) => {
  const banks = ['ICICI Bank', 'Axis Bank', 'SBI', 'UBI', 'HDFC Bank', 'Kotak Mahindra Bank'];

  const handleInputChange = (field: string, value: string | boolean) => {
    onUpdate({ [field]: value });
  };

  const handleBankToggle = (bank: string, checked: boolean) => {
    const currentBanks = data.homeLoanBanks || [];
    if (checked) {
      onUpdate({ homeLoanBanks: [...currentBanks, bank] });
    } else {
      onUpdate({ homeLoanBanks: currentBanks.filter((b: string) => b !== bank) });
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg lg:text-xl">Financial Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pricePerSft" className="text-sm font-medium">Price per Sft (₹)</Label>
            <Input
              id="pricePerSft"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 5000"
              value={data.pricePerSft || ''}
              onChange={(e) => handleInputChange('pricePerSft', e.target.value)}
              className={errors.pricePerSft ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.pricePerSft && <p className="text-red-500 text-xs mt-1">{errors.pricePerSft}</p>}
            <p className="text-xs lg:text-sm text-gray-500">Price per square foot (Range: ₹100 - ₹100,000)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseProjectPrice" className="text-sm font-medium">Base Project Price (₹)</Label>
            <Input
              id="baseProjectPrice"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 14747500"
              value={data.baseProjectPrice || ''}
              onChange={(e) => handleInputChange('baseProjectPrice', e.target.value)}
              className={errors.baseProjectPrice ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.baseProjectPrice && <p className="text-red-500 text-xs mt-1">{errors.baseProjectPrice}</p>}
            <p className="text-xs lg:text-sm text-gray-500">Base price for the project</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carParkingCost" className="text-sm font-medium">Car Parking Cost (₹)</Label>
            <Input
              id="carParkingCost"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 200000"
              value={data.carParkingCost || ''}
              onChange={(e) => handleInputChange('carParkingCost', e.target.value)}
              className={errors.carParkingCost ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.carParkingCost && <p className="text-red-500 text-xs mt-1">{errors.carParkingCost}</p>}
            <p className="text-xs lg:text-sm text-gray-500">Additional cost for car parking space</p>
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="commissionPercentage" className="text-sm font-medium">Commission Percentage (%)</Label>
            <Input
              id="commissionPercentage"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 2.5"
              value={data.commissionPercentage || ''}
              onChange={(e) => handleInputChange('commissionPercentage', e.target.value)}
              className={errors.commissionPercentage ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.commissionPercentage && <p className="text-red-500 text-xs mt-1">{errors.commissionPercentage}</p>}
            <p className="text-xs lg:text-sm text-gray-500">Commission percentage for agents (Range: 0-100%)</p>
          </div> */}
          {/* 
          <div className="space-y-2">
            <Label htmlFor="payoutPeriod" className="text-sm font-medium">Payout Period (Days)</Label>
            <Input
              id="payoutPeriod"
              type="number"
              step="any"
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="e.g., 30"
              value={data.payoutPeriod || ''}
              onChange={(e) => handleInputChange('payoutPeriod', e.target.value)}
              className={errors.payoutPeriod ? 'border-red-500' : ''}
              disabled={isViewMode}
            />
            {errors.payoutPeriod && <p className="text-red-500 text-xs mt-1">{errors.payoutPeriod}</p>}
            <p className="text-xs lg:text-sm text-gray-500">Payout period after agreement of sale (Range: 1-365 days)</p>
          </div> */}

          {/* <div className="space-y-2">
            <Label htmlFor="homeLoan">Home Loan Availability</Label>
            <Select onValueChange={(value) => handleInputChange('homeLoan', value)} value={data.homeLoan || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.homeLoan ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select banks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ICICI">ICICI</SelectItem>
                <SelectItem value="Axis">Axis</SelectItem>
                <SelectItem value="SBI">SBI</SelectItem>
                <SelectItem value="HDFC">HDFC</SelectItem>
              </SelectContent>
            </Select>
            {errors.homeLoan && <p className="text-red-500 text-xs mt-1">{errors.homeLoan}</p>}
          </div> */}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg lg:text-xl">Available Banks for Loan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Select banks available for home loan approval</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {banks.map((bank) => (
              <div key={bank} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                <Checkbox
                  id={`bank-${bank}`}
                  checked={(data.homeLoanBanks || []).includes(bank)}
                  onCheckedChange={(checked) => handleBankToggle(bank, checked as boolean)}
                  disabled={isViewMode}
                />
                <Label htmlFor={`bank-${bank}`} className="text-sm font-normal cursor-pointer flex-1">
                  {bank}
                </Label>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="homeLoanOthers" className="text-sm font-medium">Other Banks</Label>
            <Input
              id="homeLoanOthers"
              type="text"
              placeholder="Enter other bank names (comma separated)"
              value={data.homeLoanOthers || ''}
              onChange={(e) => handleInputChange('homeLoanOthers', e.target.value)}
              disabled={isViewMode}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

