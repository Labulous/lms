import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Doctor {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

interface DoctorFieldsProps {
  doctor: Doctor;
  onChange: (field: keyof Doctor, value: string) => void;
  onRemove: () => void;
  showRemove: boolean;
}

const DoctorFields: React.FC<DoctorFieldsProps> = ({ doctor, onChange, onRemove, showRemove }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onChange(name as keyof Doctor, value);
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Doctor Information</CardTitle>
          {showRemove && (
            <Button
              type="button"
              onClick={onRemove}
              variant="ghost"
              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
            >
              Remove Doctor
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              name="name"
              required
              value={doctor.name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              name="phone"
              value={doctor.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={doctor.email}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={doctor.notes}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorFields;