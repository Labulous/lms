import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { patientsService } from "@/services/patientsService";

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
  (
    {
      className,
      onClose,
      initiallyOpen = false,
      trigger,
      patients,
      setPatients,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = useState(initiallyOpen);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
    });

    const { user } = useAuth();

    useEffect(() => {
      if (initiallyOpen) {
        setOpen(true);
      }
    }, [initiallyOpen]);

    const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen);
      if (!newOpen && onClose) {
        onClose();
      }
    };

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
        setOpen(false);
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

    return (
      <div ref={ref} className={className} {...props}>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent className="w-[420px] p-3">
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white"
                  onClick={handleSubmit}
                >
                  Create Patient
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);

export default NewPatient;
