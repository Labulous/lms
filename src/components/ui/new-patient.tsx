import React, { useState, useEffect, useRef } from "react";
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
import { isValid, parse, parseISO } from "date-fns";

interface NewPatientProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  className?: string;
  initiallyOpen?: boolean;
  trigger: React.ReactNode;
  patients: any[];
  setPatients: React.Dispatch<React.SetStateAction<any[]>>;
  patientDialogOpen: boolean;
  setPatientDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NewPatient = React.forwardRef<HTMLDivElement, NewPatientProps>(
  (
    {
      className,
      initiallyOpen = false,
      trigger,
      patients,
      setPatients,
      patientDialogOpen,
      setPatientDialogOpen,
      ...props
    },
    ref
  ) => {
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
      if (!formData.first_name) {
        toast.error("First name is required");
        return;
      }
      if (!formData.last_name) {
        toast.error("Last name is required");
        return;
      }
      if (!formData.email) {
        toast.error("Email is required");
        return;
      }

      if (formData.dob) {
        const parsedDate = parse(formData.dob, "dd/MM/yyyy", new Date());
        const validateDate = isValid(parsedDate);
        if (!validateDate) {
          toast.error("Please enter valid date format");
          return;
        }
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

          if (patientExistWithPhone && patientExistWithPhone.length > 0) {
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
              dob: formData.dob,
              gender: formData.gender,
              insurance_provider: formData.provider,
              insurance_carrier_number: formData.carrier_number,
              insurance_contract_number: formData.contract_number,
              insurance_member_id: formData.member_id,
              insurance_other_info: formData.other_info,
              emergency_first_name: formData.emergency_first_name,
              emergency_last_name: formData.emergency_last_name,
              emergency_relationship: formData.emergency_relationship,
              emergency_phone: formData.emergency_phone,
              emergency_memo: formData.memo,
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
        setLoading(false);
        setPatientDialogOpen(false);
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
      <div ref={ref}>
        <Dialog open={patientDialogOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="max-w-[800px] p-0 border-0 border-r-3 overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                <h5 className="bg-[#dbe6f5] text-[#000] p-3 text-[20px]">
                  Create Patient
                </h5>
              </DialogTitle>
            </DialogHeader>
            <div className="md:max-h-[500px] max-h-[400px] overflow-x-hidden overflow-y-scroll p-[15px] pt-0 pb-0 scrollbar-hidden">
              <div className="space-y-2">
                <div className="space-y-2">
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="text-[#000] text-[15px]"
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
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        className="text-[#000] text-[15px]"
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
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
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
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Phone
                      </Label>
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
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        DOB
                      </Label>
                      <Input
                        className="text-[#000] text-[15px]"
                        type="text"
                        id="dob"
                        name="dob"
                        placeholder="DD/MM/YYYY"
                        value={formData.dob}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dob: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Gender
                      </Label>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            gender: value,
                          });
                        }}
                      >
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
                  <h5 className="mt-3 bg-[#374559] text-[#fff] p-2 tetx-[14px] font-[600] rounded-[5px] mr-0 w-full">
                    Insurance Information
                  </h5>
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Provider
                      </Label>
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
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Carrier Number
                      </Label>
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
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Contract Number
                      </Label>
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
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Member’s ID Number
                      </Label>
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
                  <Label className="text-[14px] mb-1.5 block font-[400]">
                    Other Information
                  </Label>
                  <Textarea
                    id="other_info"
                    name="other_info"
                    placeholder="Enter other information"
                    className="bg-white h-[100px] resize-none"
                    value={formData.other_info}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        other_info: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <h5 className="mt-3 bg-[#374559] text-[#fff] p-2 tetx-[14px] font-[600] rounded-[5px] mr-0 w-full">
                    Emergency Contact
                  </h5>
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        First Name
                      </Label>
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
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Last Name
                      </Label>
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
                  <div className="sm:flex block items-center justify-between gap-2">
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Relationship
                      </Label>
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
                    <div className="sm:w-[50%] w-[100%]">
                      <Label className="text-[14px] mb-1.5 block font-[400]">
                        Phone
                      </Label>
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
                  <Label className="text-[14px] mb-1.5 block font-[400]">
                    Memo
                  </Label>
                  <Textarea
                    id="memo"
                    name="memo"
                    placeholder="Enter memo"
                    className="bg-white h-[100px] resize-none"
                    value={formData.memo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        memo: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={loading}
                className="w-full text-white rounded-br-0 rounded-bl-0"
                onClick={handleSubmit}
              >
                Create Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default NewPatient;
