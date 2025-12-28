import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';


interface SecondaryDetailsProps {
  data: any;
  onUpdate: (data: any) => void;
  errors?: any;
  isViewMode?: boolean;
}

export const SecondaryDetails: React.FC<SecondaryDetailsProps> = ({ data, onUpdate, errors = {}, isViewMode = false }) => {
  const handleInputChange = (field: string, value: string | number) => {
    onUpdate({ [field]: value });
  };

  // Initialize pocDetails as array if it doesn't exist or migrate from old single POC format
  React.useEffect(() => {
    if (!data.pocDetails || !Array.isArray(data.pocDetails)) {
      // Check if old single POC format exists
      if (data.pocName || data.pocContact || data.pocRole) {
        // Migrate old boolean CP to new string format
        let pocCPValue = '';
        if (data.pocCP === true || data.pocCP === 'true') {
          pocCPValue = 'Accepting'; // Default migration for old true values
        } else if (typeof data.pocCP === 'string' && ['Accepting', 'On-boarded', 'Not-accepted'].includes(data.pocCP)) {
          pocCPValue = data.pocCP;
        }
        
        onUpdate({
          pocDetails: [{
            pocName: data.pocName || '',
            pocContact: data.pocContact || '',
            pocRole: data.pocRole || '',
            pocCP: pocCPValue
          }]
        });
      } else {
        // Initialize with one empty POC
        onUpdate({
          pocDetails: [{
            pocName: '',
            pocContact: '',
            pocRole: '',
            pocCP: ''
          }]
        });
      }
    }
  }, []);

  const addPOC = () => {
    const currentPOCs = data.pocDetails || [];
    onUpdate({
      pocDetails: [...currentPOCs, { pocName: '', pocContact: '', pocRole: '', pocCP: '' }]
    });
  };

  const removePOC = (index: number) => {
    const currentPOCs = data.pocDetails || [];
    if (currentPOCs.length > 1) {
      onUpdate({
        pocDetails: currentPOCs.filter((_: any, i: number) => i !== index)
      });
    }
  };

  const updatePOC = (index: number, field: string, value: string) => {
    const currentPOCs = data.pocDetails || [];
    const updatedPOCs = currentPOCs.map((poc: any, i: number) => 
      i === index ? { ...poc, [field]: value } : poc
    );
    onUpdate({ pocDetails: updatedPOCs });
  };

  // Initialize registration modes with default values if not already set
  React.useEffect(() => {
    const hasRegistrationValues = data.whatsappRegistration || data.emailRegistration || data.webFormRegistration || data.crmAppRegistration;

    if (!hasRegistrationValues) {
      onUpdate({
        whatsappRegistration: 'yes',
        emailRegistration: 'yes',
        webFormRegistration: 'no',
        crmAppRegistration: 'no'
      });
    }
  }, []);


  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
            <CardTitle>Commission & Payout</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label htmlFor="commissionPercentage">Commission Percentage</Label>
            <Input
                id="commissionPercentage"
                type="number"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="e.g., 2.5"
                value={data.commissionPercentage || ''}
                onChange={(e) => onUpdate({ commissionPercentage: e.target.value })}
                className={errors.commissionPercentage ? 'border-red-500' : ''}
                disabled={isViewMode}
            />
            {errors.commissionPercentage && <p className="text-red-500 text-xs mt-1">{errors.commissionPercentage}</p>}
            </div>
            <div className="space-y-2">
            <Label htmlFor="payoutTimePeriod">Payout Time Period (days)</Label>
            <Input
                id="payoutTimePeriod"
                type="number"
                step="any"
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="e.g., 30"
                value={data.payoutTimePeriod || ''}
                onChange={(e) => onUpdate({ payoutTimePeriod: e.target.value })}
                className={errors.payoutTimePeriod ? 'border-red-500' : ''}
                disabled={isViewMode}
            />
            {errors.payoutTimePeriod && <p className="text-red-500 text-xs mt-1">{errors.payoutTimePeriod}</p>}
            </div>
        </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Registration Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Is Lead Registration Required Before Site Visit?</Label>
            <Select onValueChange={(value) => handleInputChange('leadRegistrationRequired', value)} value={data.leadRegistrationRequired || ''} disabled={isViewMode}>
              <SelectTrigger className={errors.leadRegistrationRequired ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {errors.leadRegistrationRequired && <p className="text-red-500 text-xs mt-1">{errors.leadRegistrationRequired}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lead Management</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="leadAcknowledgementTime">Turnaround Time for Lead Acknowledgement (minutes)</Label>
                <Input
                    id="leadAcknowledgementTime"
                    type="number"
                    placeholder="24"
                    value={data.leadAcknowledgementTime || ''}
                    onChange={(e) => handleInputChange('leadAcknowledgementTime', e.target.value)}
                    className={errors.leadAcknowledgementTime ? 'border-red-500' : ''}
                    disabled={isViewMode}
                />
                {errors.leadAcknowledgementTime && <p className="text-red-500 text-xs mt-1">{errors.leadAcknowledgementTime}</p>}
            </div>

            <div className="space-y-2">
                <Label>Is there a validity period for a registered lead?</Label>
                <Select onValueChange={(value) => handleInputChange('validityPeriod', value)} value={data.validityPeriod || ''} disabled={isViewMode}>
                    <SelectTrigger className={errors.validityPeriod ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                </Select>
                {errors.validityPeriod && <p className="text-red-500 text-xs mt-1">{errors.validityPeriod}</p>}
            </div>

            {data.validityPeriod === 'yes' && (
                <div className="space-y-2">
                    <Label htmlFor="validityPeriodValue">Lead Validity Period (days)</Label>
                    <Input
                        id="validityPeriodValue"
                        type="number"
                        placeholder="e.g., 90"
                        value={data.validityPeriodValue || ''}
                        onChange={(e) => handleInputChange('validityPeriodValue', e.target.value)}
                        className={errors.validityPeriodValue ? 'border-red-500' : ''}
                        disabled={isViewMode}
                    />
                    {errors.validityPeriodValue && <p className="text-red-500 text-xs mt-1">{errors.validityPeriodValue}</p>}
                </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Modes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Select at least one registration mode</p>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="whatsappRegistration"
                  checked={data.whatsappRegistration === 'yes'}
                  onCheckedChange={(checked) => handleInputChange('whatsappRegistration', checked ? 'yes' : 'no')}
                  disabled={isViewMode}
                />
                <Label htmlFor="whatsappRegistration" className="text-sm font-normal cursor-pointer">
                  WhatsApp Registration
                </Label>
              </div>
              {data.whatsappRegistration === 'yes' && (
                <Input
                  type="text"
                  placeholder="Enter WhatsApp details (e.g., number, group link)"
                  value={data.whatsappRegistrationDetails || ''}
                  onChange={(e) => handleInputChange('whatsappRegistrationDetails', e.target.value)}
                  disabled={isViewMode}
                  className="ml-6"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailRegistration"
                  checked={data.emailRegistration === 'yes'}
                  onCheckedChange={(checked) => handleInputChange('emailRegistration', checked ? 'yes' : 'no')}
                  disabled={isViewMode}
                />
                <Label htmlFor="emailRegistration" className="text-sm font-normal cursor-pointer">
                  Email Registration
                </Label>
              </div>
              {data.emailRegistration === 'yes' && (
                <Input
                  type="text"
                  placeholder="Enter email address"
                  value={data.emailRegistrationDetails || ''}
                  onChange={(e) => handleInputChange('emailRegistrationDetails', e.target.value)}
                  disabled={isViewMode}
                  className="ml-6"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="webFormRegistration"
                  checked={data.webFormRegistration === 'yes'}
                  onCheckedChange={(checked) => handleInputChange('webFormRegistration', checked ? 'yes' : 'no')}
                  disabled={isViewMode}
                />
                <Label htmlFor="webFormRegistration" className="text-sm font-normal cursor-pointer">
                  Web Form Registration
                </Label>
              </div>
              {data.webFormRegistration === 'yes' && (
                <Input
                  type="text"
                  placeholder="Enter web form URL"
                  value={data.webFormRegistrationDetails || ''}
                  onChange={(e) => handleInputChange('webFormRegistrationDetails', e.target.value)}
                  disabled={isViewMode}
                  className="ml-6"
                />
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="crmAppRegistration"
                  checked={data.crmAppRegistration === 'yes'}
                  onCheckedChange={(checked) => handleInputChange('crmAppRegistration', checked ? 'yes' : 'no')}
                  disabled={isViewMode}
                />
                <Label htmlFor="crmAppRegistration" className="text-sm font-normal cursor-pointer">
                  CRM App Access Registration
                </Label>
              </div>
              {data.crmAppRegistration === 'yes' && (
                <Input
                  type="text"
                  placeholder="Enter CRM app details"
                  value={data.crmAppRegistrationDetails || ''}
                  onChange={(e) => handleInputChange('crmAppRegistrationDetails', e.target.value)}
                  disabled={isViewMode}
                  className="ml-6"
                />
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="duringSiteVisitRegistration"
                checked={data.duringSiteVisitRegistration === 'yes'}
                onCheckedChange={(checked) => handleInputChange('duringSiteVisitRegistration', checked ? 'yes' : 'no')}
                disabled={isViewMode}
              />
              <Label htmlFor="duringSiteVisitRegistration" className="text-sm font-normal cursor-pointer">
                During Site Visit
              </Label>
            </div>
          </div>
          
          {(errors.whatsappRegistration || errors.emailRegistration || errors.webFormRegistration || errors.crmAppRegistration || errors.duringSiteVisitRegistration) && (
            <div className="text-red-500 text-xs">
              Please select at least one registration mode
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Point of Contact (POC) Information</CardTitle>
          {!isViewMode && (
            <Button type="button" onClick={addPOC} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {(data.pocDetails || []).map((poc: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">POC {index + 1}</h4>
                {!isViewMode && (data.pocDetails || []).length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removePOC(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`pocName-${index}`}>POC Name</Label>
                  <Input
                    id={`pocName-${index}`}
                    placeholder="POC Name"
                    value={poc.pocName || ''}
                    onChange={(e) => updatePOC(index, 'pocName', e.target.value)}
                    className={errors[`pocDetails.${index}.pocName`] ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {errors[`pocDetails.${index}.pocName`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`pocDetails.${index}.pocName`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pocContact-${index}`}>POC Contact</Label>
                  <Input
                    id={`pocContact-${index}`}
                    placeholder="POC Contact"
                    value={poc.pocContact || ''}
                    onChange={(e) => updatePOC(index, 'pocContact', e.target.value)}
                    className={errors[`pocDetails.${index}.pocContact`] ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {errors[`pocDetails.${index}.pocContact`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`pocDetails.${index}.pocContact`]}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`pocRole-${index}`}>POC Role</Label>
                  <Input
                    id={`pocRole-${index}`}
                    placeholder="POC Role"
                    value={poc.pocRole || ''}
                    onChange={(e) => updatePOC(index, 'pocRole', e.target.value)}
                    className={errors[`pocDetails.${index}.pocRole`] ? 'border-red-500' : ''}
                    disabled={isViewMode}
                  />
                  {errors[`pocDetails.${index}.pocRole`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`pocDetails.${index}.pocRole`]}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor={`pocCP-${index}`}>CP</Label>
                <Select
                  value={poc.pocCP || ''}
                  onValueChange={(value) => updatePOC(index, 'pocCP', value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger id={`pocCP-${index}`} className={errors[`pocDetails.${index}.pocCP`] ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select CP status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Accepting">Accepting</SelectItem>
                    <SelectItem value="On-boarded">On-boarded</SelectItem>
                    <SelectItem value="Not-accepted">Not-accepted</SelectItem>
                  </SelectContent>
                </Select>
                {errors[`pocDetails.${index}.pocCP`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`pocDetails.${index}.pocCP`]}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};