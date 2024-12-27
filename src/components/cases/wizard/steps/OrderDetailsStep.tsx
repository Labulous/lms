import React, { useEffect, useMemo } from "react";
import {
  CASE_STATUSES,
  DELIVERY_METHODS,
} from "../../../../data/mockCasesData";
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
import { DateTimePicker } from "@/components/ui/date-time-picker"; // Import DateTimePicker component
import { Separator } from "@/components/ui/separator"; // Import Separator component
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { FormData } from "@/types/supabase";
import { FormData as CaseFormData } from "../CaseWizard";
const logger = createLogger({ module: "OrderDetailsStep" });

interface OrderDetailsStepProps {
  formData: CaseFormData;
  onChange: (field: keyof CaseFormData, value: any) => void;
  errors?: Partial<CaseFormData>;
  clients: Client[];
  loading?: boolean;
}

const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  formData,
  onChange,
  errors = {},
  clients = [],
  loading = false,
}) => {
  // Debug log for initial render and props
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
  }, []); // Only run on mount

  // Find the selected client
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
      onChange(name as keyof FormData, checkbox.checked);
      if (name === "isDueDateTBD" && checkbox.checked) {
        onChange("dueDate", undefined);
      }
    } else {
      onChange(name as keyof FormData, value);
    }
  };

  const handleDateChange =
    (field: keyof FormData) => (date: Date | undefined) => {
      onChange(field, date ? date.toISOString().split("T")[0] : "");
    };

  return (
    <div>
      <div className="grid grid-cols-12 gap-6 relative">
        {/* Column 1: Client Selection */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="clientId" className="text-xs">
                Client *
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
                        onChange("doctorId", undefined); // Reset doctor when client changes
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
                Doctor *
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
                Patient Name *
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

        {/* Separator between columns 1 and 2 */}
        <div className="absolute left-[33.33%] top-0 h-full">
          <Separator orientation="vertical" className="h-full" />
        </div>

        {/* Column 2: Order Details */}
        <div className="col-span-4 px-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="orderDate" className="text-xs">
                Order Date *
              </Label>
              <DatePicker
                date={
                  formData.orderDate ? new Date(formData.orderDate) : undefined
                }
                onSelect={handleDateChange("orderDate")}
                className={cn(
                  "bg-white [&>button]:bg-white",
                  errors.orderDate ? "border-red-500" : ""
                )}
              />
              {errors.orderDate && (
                <p className="mt-1 text-sm text-red-600">{errors.orderDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="dueDate" className="text-xs">
                  Due Date
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
                  onSelect={handleDateChange("dueDate")}
                  className={cn(
                    "bg-white [&>button]:bg-white",
                    errors.dueDate ? "border-red-500" : ""
                  )}
                />
              )}
              {errors.dueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="appointmentDate" className="text-xs">
                Appointment Date & Time
              </Label>
              <div className="w-full">
                <DateTimePicker
                  date={
                    formData.appointmentDate
                      ? new Date(formData.appointmentDate)
                      : undefined
                  }
                  onSelect={(date) => handleDateChange("appointmentDate")(date)}
                  className={cn(errors.appointmentDate && "border-red-500")}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Separator between columns 2 and 3 */}
        <div className="absolute left-[66.66%] top-0 h-full">
          <Separator orientation="vertical" className="h-full" />
        </div>

        {/* Column 3: Status & Delivery */}
        <div className="col-span-4">
          <div className="space-y-4">
            <div className="space-y-0">
              <Label htmlFor="status" className="text-xs">
                Status *
              </Label>
              <Select
                name="status"
                value={formData.status}
                onValueChange={(value) => {
                  onChange("status", value);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "bg-white [&>button]:bg-white",
                    errors.status ? "border-red-500" : ""
                  )}
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            <div className="space-y-0">
              <Label htmlFor="deliveryMethod" className="text-xs">
                Delivery Method *
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

            <div className="space-y-0">
              <Label htmlFor="workingPanName" className="text-xs">
                Working Pan
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="text"
                  id="workingPanName"
                  name="workingPanName"
                  placeholder="Pan Name"
                  value={formData.workingPanName || ""}
                  onChange={handleInputChange}
                  className={cn(
                    "bg-white flex-1",
                    errors.workingPanName ? "border-red-500" : ""
                  )}
                />
                <ColorPicker
                  id="workingPanColor"
                  value={formData.workingPanColor || "#FF0000"}
                  onChange={(color) => {
                    onChange("workingPanColor", color);
                  }}
                  className="flex-shrink-0"
                />
              </div>
              {errors.workingPanName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.workingPanName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsStep;
