import React, { useEffect, useMemo, useState, useRef } from "react";
import { DELIVERY_METHODS } from "../../../../data/mockCasesData";
import { Client } from "../../../../services/clientsService";
import { createLogger } from "../../../../utils/logger";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { FormData as CaseFormData } from "../CaseWizard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CASE_STATUS_DESCRIPTIONS, WorkingTag } from "@/types/supabase";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
const logger = createLogger({ module: "OrderDetailsStep" });

interface OrderDetailsStepProps {
  formData: CaseFormData;
  onChange: (
    field: keyof CaseFormData,
    value: string | boolean | number | undefined
  ) => void;
  errors?: Partial<CaseFormData>;
  clients: Client[];
  loading?: boolean;
  isClient: boolean;
}

const ClientOrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  formData,
  onChange,
  errors = {},
  clients = [],
  loading = false,
  isClient = false,
}) => {
  // Debug log for initial render and props
  const [tags, setTags] = useState<WorkingTag[]>([]);
  const [pans, setPans] = useState<WorkingTag[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isAddingPan, setIsAddingPan] = useState(false);
  const addTagTriggerRef = useRef<HTMLButtonElement>(null);
  const [newTagData, setNewTagData] = useState({ name: "", color: "#000000" });
  const { user } = useAuth();
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      logger.debug("OrderDetailsStep mounted", {
        hasFormData: !!formData,
        clientsCount: clients?.length,
        loading,
        selectedClientId: formData?.clientId,
        selectedClient: clients?.find((c) => c.id === formData?.clientId),
        errors: Object.keys(errors || {}),
      });
    }
  }, []);

  const selectedClient = useMemo(
    () => (clients || []).find((client) => client.id === formData.clientId),
    [clients, formData.clientId]
  );

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      const checkbox = event.target as HTMLInputElement;
      onChange(name as keyof CaseFormData, checkbox.checked);
      if (name === "isDueDateTBD" && checkbox.checked) {
        onChange("dueDate", undefined);
      }
    } else {
      onChange(name as keyof CaseFormData, value);
    }
  };

  const fetchTags = async () => {
    try {
      setLoading(true);
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData?.labId) {
        toast.error("Lab not found");
        return;
      }

      const { data: tags, error } = await supabase
        .from("working_tags")
        .select("*")
        .eq("lab_id", labData.labId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTags(tags || []);
      const { data: pans, error: panError } = await supabase
        .from("working_pans")
        .select("*")
        .eq("lab_id", labData.labId)
        .order("created_at", { ascending: false });

      if (panError) throw error;
      setPans(pans || []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [user?.id]);

  const handleCreateTag = async () => {
    try {
      setLoading(true);
      const labData = await getLabIdByUserId(user?.id as string);
      if (!labData?.labId) {
        toast.error("Lab not found");
        return;
      }

      const { error } = await supabase.from("working_tags").insert([
        {
          name: newTagData.name,
          color: newTagData.color,
          lab_id: labData.labId,
        },
      ]);

      if (error) throw error;
      toast.success("Tag created successfully");
      fetchTags(); // Refresh the tags list
      setIsAddingTag(false);
      setNewTagData({ name: "", color: "#000000" });
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-12 gap-6 relative">
        {/* Column 1: Client Selection */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="clientId" className="text-xs">
                Client <span className="text-red-500">*</span>
              </Label>
              <div className="mt-1">
                {loading ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading clients...</span>
                  </div>
                ) : (
                  <>
                    <Select
                      name="clientId"
                      value={formData.clientId}
                      onValueChange={(value) => {
                        onChange("clientId", value);
                        onChange("doctorId" as keyof CaseFormData, undefined); // Reset doctor when client changes
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "bg-white",
                          errors.clientId ? "border-red-500" : ""
                        )}
                      >
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients && clients.length > 0 ? (
                          clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.clientName || "Unnamed Client"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="_no_clients" disabled>
                            No clients available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.clientId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.clientId}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-0">
              <Label htmlFor="doctorId" className="text-xs">
                Doctor <span className="text-red-500">*</span>
              </Label>
              <Select
                name="doctorId"
                value={formData.doctorId}
                onValueChange={(value) => {
                  onChange("doctorId", value);
                }}
                disabled={!selectedClient}
              >
                <SelectTrigger
                  className={cn(
                    "bg-white",
                    errors.doctorId ? "border-red-500" : "",
                    !selectedClient && "opacity-50"
                  )}
                >
                  <SelectValue placeholder="Select a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {selectedClient?.doctors &&
                  selectedClient.doctors.length > 0 ? (
                    selectedClient.doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id || "_no_id"}>
                        {doctor.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="_no_doctors" disabled>
                      No doctors available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.doctorId && (
                <p className="mt-1 text-sm text-red-600">{errors.doctorId}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="patientFirstName" className="text-xs">
                Patient Name <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="text"
                    id="patientFirstName"
                    name="patientFirstName"
                    placeholder="First Name"
                    value={formData.patientFirstName}
                    onChange={handleInputChange}
                    className={cn(
                      "bg-white",
                      errors.patientFirstName ? "border-red-500" : ""
                    )}
                  />
                  {errors.patientFirstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.patientFirstName}
                    </p>
                  )}
                </div>
                <div>
                  <Input
                    type="text"
                    id="patientLastName"
                    name="patientLastName"
                    placeholder="Last Name"
                    value={formData.patientLastName}
                    onChange={handleInputChange}
                    className={cn(
                      "bg-white",
                      errors.patientLastName ? "border-red-500" : ""
                    )}
                  />
                  {errors.patientLastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.patientLastName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Order Details */}
        <div className="col-span-4 px-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="orderDate" className="text-xs">
                Order Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={
                  formData.orderDate ? new Date(formData.orderDate) : undefined
                }
                onSelect={(date) => onChange("orderDate", date?.toISOString())}
                className={cn(errors.orderDate ? "border-red-500" : "")}
                minDate={new Date(2020, 0, 1)}
                maxDate={new Date()}
                dateFormat="MM/dd/yyyy"
                placeholder="Select order date"
                updatedDate={
                  formData.dueDate ? new Date(formData.orderDate) : new Date()
                }
              />
              {errors.orderDate && (
                <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <div className="flex justify-between items-center">
                <Label htmlFor="dueDate" className="text-xs">
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="isDueDateTBD" className="text-xs">
                    TBD
                  </Label>
                  <Checkbox
                    id="isDueDateTBD"
                    name="isDueDateTBD"
                    checked={formData.isDueDateTBD}
                    onCheckedChange={(checked) => {
                      onChange("isDueDateTBD", checked);
                      if (checked) {
                        onChange("dueDate", undefined);
                      }
                    }}
                  />
                </div>
              </div>
              {!formData.isDueDateTBD && (
                <DatePicker
                  date={
                    formData.dueDate ? new Date(formData.dueDate) : undefined
                  }
                  onSelect={(date) => onChange("dueDate", date?.toISOString())}
                  className={cn(errors.dueDate ? "border-red-500" : "")}
                  minDate={
                    formData.orderDate
                      ? new Date(formData.orderDate)
                      : undefined
                  }
                  dateFormat="MM/dd/yyyy"
                  placeholder="Select due date"
                  updatedDate={
                    formData.dueDate ? new Date(formData.dueDate) : undefined
                  }
                />
              )}
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="appointmentDate" className="text-xs">
                Appointment Date & Time <span className="text-red-500">*</span>
              </Label>
              <div className="w-full">
                <DateTimePicker
                  date={
                    formData.appointmentDate
                      ? new Date(formData.appointmentDate)
                      : undefined
                  }
                  onSelect={(date) =>
                    onChange("appointmentDate", date?.toISOString())
                  }
                  className={cn(errors.appointmentDate ? "border-red-500" : "")}
                  minDate={
                    formData.orderDate
                      ? new Date(formData.orderDate)
                      : undefined
                  }
                  dateFormat="MM/dd/yyyy h:mm aa"
                  placeholder="Select appointment date & time"
                  updatedDate={
                    formData.appointmentDate
                      ? new Date(formData.appointmentDate)
                      : undefined
                  }
                />
                {errors.appointmentDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.appointmentDate}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Status & Delivery */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="status" className="text-xs">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => onChange("status", value)}
              >
                <SelectTrigger
                  className={cn(
                    "bg-white [&>button]:bg-white",
                    errors.statusError ? "border-red-500" : ""
                  )}
                >
                  <SelectValue placeholder="Select status" />
                  {errors.statusError && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.statusError}
                    </p>
                  )}
                </SelectTrigger>
                <SelectContent>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="in_queue">In Queue</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS["in_queue"]}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="draft">Draft</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS["draft"]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="deliveryMethod" className="text-xs">
                Delivery Method <span className="text-red-500">*</span>
              </Label>
              <Select
                name="deliveryMethod"
                value={formData.deliveryMethod}
                onValueChange={(value) => {
                  onChange("deliveryMethod", value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "bg-white [&>button]:bg-white",
                    errors.deliveryMethod ? "border-red-500" : ""
                  )}
                >
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deliveryMethod && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.deliveryMethod}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderDetailsStep;
