import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import {
  Patient,
  PatientFormData,
  patientsService,
} from "@/services/patientsService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "./date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface NewPatientProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  onClose?: () => void;
  initiallyOpen?: boolean;
  trigger: React.ReactNode;
  patients: any[];
  setPatients: React.Dispatch<React.SetStateAction<any[]>>;
}

const NewPatient = React.forwardRef<HTMLDivElement, NewPatientProps>(
  ({
    className,
    onClose,
    initiallyOpen = false,
    trigger,
    patients,
    setPatients,
    ...props
  }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PatientFormData>({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      dob: "",
      gender: "",
      provider: "",
      carrier_number: "",
      contract_number: "",
      member_id: "",
      other_info: "",
      emergency_first_name: "",
      emergency_last_name: "",
      emergency_relationship: "",
      emergency_phone: "",
      memo: "",
    });

    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        toast.error("All fields are required");
        return;
      }
      setLoading(true);
      e.preventDefault();
      try {
        const { data: patientExistWithEmail, error: patientExistError } =
          await supabase
            .from("patients")
            .select("*")
            .eq("email", formData.email)
            .single();

        if (patientExistWithEmail) {
          throw new Error("The email already exists");
        }

        if (formData.phone) {
          const {
            data: patientExistWithPhone,
            error: patientExistWithPhoneError,
          } = await supabase
            .from("patients")
            .select("*")
            .eq("phone", formData.phone);

          if (patientExistWithPhone) {
            throw new Error("The phone already exists");
          }
        }

        const { data: patientInsertData, error: patientInsertError } =
          await supabase
            .from("patients")
            .insert({
              first_name: formData.first_name,
              last_name: formData.last_name,
              email: formData.email,
              phone: formData.phone,
            })
            .select("*")
            .single();

        if (patientInsertError) throw patientInsertError;
        toast.success("Patient created successfully");
        patientInsertData.email = await patientsService.getMaskedEmail(
          patientInsertData.email
        );
        setPatients([patientInsertData, ...patients]);
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
        });
        setLoading(false);
        onClose?.();
      } catch (error) {
        setLoading(false);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("An unexpected error occurred");
        }
      }
    };

    const handleInputChange = () => {};

    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="w-[420px] p-3">
          <DialogHeader>
            <DialogTitle>Create Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="first_name"
                    name="first_name"
                    placeholder="Enter first name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        first_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="last_name"
                    name="last_name"
                    placeholder="Enter last name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        last_name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="number"
                    id="phone"
                    name="phone"
                    placeholder="Enter phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>DOB</Label>
                  <DatePicker
                    date={formData.dob ? new Date(formData.dob) : undefined}
                    // onSelect={(date) => onChange("dob", date?.toISOString())}
                    maxDate={new Date()}
                    dateFormat="MM/dd/yyyy"
                    placeholder="Select DOB"
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select name="gender" value={formData.gender}>
                    <SelectTrigger className="bg-white [&>button]:bg-white">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="Male" value="Male">
                        Male
                      </SelectItem>
                      <SelectItem key="Female" value="Female">
                        Female
                      </SelectItem>
                      <SelectItem key="Other" value="Other">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h5>Insurance Information</h5>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Provider</Label>
                  <Input
                    type="text"
                    id="provider"
                    name="provider"
                    placeholder="Enter provider"
                    className="w-full"
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        provider: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Carrier Number</Label>
                  <Input
                    type="text"
                    id="carrier_number"
                    name="carrier_number"
                    placeholder="Enter carrier number"
                    value={formData.carrier_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        carrier_number: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Contract Number</Label>
                  <Input
                    type="text"
                    id="contract_number"
                    name="contract_number"
                    placeholder="Enter contract number"
                    value={formData.contract_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contract_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Member’s ID Number</Label>
                  <Input
                    type="text"
                    id="member_id"
                    name="member_id"
                    placeholder="Enter member id number"
                    value={formData.member_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        member_id: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Other Information</Label>
              <Textarea
                id="other_info"
                name="other_info"
                placeholder="Enter other information"
                className="bg-white h-[100px] resize-none"
                value={formData.other_info}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <h5>Emergency Contact</h5>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>First Name</Label>
                  <Input
                    type="text"
                    id="emergency_first_name"
                    name="emergency_first_name"
                    placeholder="Enter first name"
                    value={formData.emergency_first_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_first_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    type="text"
                    id="emergency_last_name"
                    name="emergency_last_name"
                    placeholder="Enter last name"
                    value={formData.emergency_last_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_last_name: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label>Relationship</Label>
                  <Input
                    type="text"
                    id="emergency_relationship"
                    name="emergency_relationship"
                    placeholder="Enter relationship"
                    value={formData.emergency_relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_relationship: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="text"
                    id="emergency_phone"
                    name="emergency_phone"
                    placeholder="Enter phone"
                    value={formData.emergency_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Memo</Label>
              <Textarea
                id="memo"
                name="memo"
                placeholder="Enter memo"
                className="bg-white h-[100px] resize-none"
                value={formData.memo}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white"
              onClick={handleSubmit}
            >
              Create Patient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export default NewPatient;
