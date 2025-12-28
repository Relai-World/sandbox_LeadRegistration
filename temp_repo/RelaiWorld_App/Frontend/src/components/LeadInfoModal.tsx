import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface LeadInfoModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (leadName: string, leadMobile: string) => void;
  initialName?: string;
  initialMobile?: string;
  projectName?: string;
}

export const LeadInfoModal: React.FC<LeadInfoModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialName = '',
  initialMobile = '',
  projectName = '',
}) => {
  const [leadName, setLeadName] = useState(initialName);
  const [leadMobile, setLeadMobile] = useState(initialMobile);
  const [errors, setErrors] = useState<{ name?: string; mobile?: string }>({});

  useEffect(() => {
    if (open) {
      setLeadName(initialName);
      setLeadMobile(initialMobile);
      setErrors({});
    }
  }, [open, initialName, initialMobile]);

  const validateForm = () => {
    const newErrors: { name?: string; mobile?: string } = {};
    
    if (!leadName.trim()) {
      newErrors.name = 'Lead name is required';
    }
    
    if (!leadMobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[0-9]{10,12}$/.test(leadMobile.replace(/[^0-9]/g, ''))) {
      newErrors.mobile = 'Please enter a valid mobile number (10-12 digits)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(leadName.trim(), leadMobile.replace(/[^0-9]/g, ''));
    }
  };

  const handleMobileChange = (value: string) => {
    // Allow only digits
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setLeadMobile(digitsOnly);
    if (errors.mobile) {
      setErrors({ ...errors, mobile: undefined });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lead Information</DialogTitle>
          <DialogDescription>
            {projectName ? `Enter lead details for: ${projectName}` : 'Enter lead name and mobile number'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="leadName">Lead Name *</Label>
            <Input
              id="leadName"
              value={leadName}
              onChange={(e) => {
                setLeadName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              placeholder="Enter lead name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="leadMobile">Mobile Number *</Label>
            <Input
              id="leadMobile"
              type="tel"
              value={leadMobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              placeholder="Enter mobile number"
              maxLength={12}
              className={errors.mobile ? 'border-red-500' : ''}
            />
            {errors.mobile && (
              <p className="text-sm text-red-500">{errors.mobile}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

