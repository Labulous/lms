import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  SetStateAction,
} from "react";
import { createPortal } from "react-dom";
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
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HexColorPicker } from "react-colorful";
import { useNavigate } from "react-router-dom";

const logger = createLogger({ module: "OrderDetailsStep" });

const colors = [
  "#FF5733", // Vibrant Red-Orange
  "#33FF57", // Bright Green
  "#3357FF", // Bold Blue
  "#FF33A8", // Hot Pink
  "#FFD133", // Bright Yellow
  "#33FFF5", // Aqua Blue
  "#8D33FF", // Deep Purple
  "#FF8633", // Soft Orange
  "#33FF99", // Mint Green
  "#FF3333", // Bright Red
  "#4CAF50", // Forest Green
  "#FFC107", // Amber
  "#9C27B0", // Amethyst Purple
  "#2196F3", // Sky Blue
  "#FF9800", // Vivid Orange
  "#E91E63", // Raspberry Pink
  "#607D8B", // Cool Gray
  "#673AB7", // Royal Purple
  "#00BCD4", // Cerulean Blue
  "#FFEB3B", // Lemon Yellow
];

interface OrderDetailsStepProps {
  formData: CaseFormData;
  onChange: (
    field: keyof CaseFormData,
    value: string | boolean | number | undefined
  ) => void;
  errors?: Partial<CaseFormData>;
  clients: Client[];
  loading?: boolean;
  isAddingPan: boolean;
  setIsAddingPan: React.Dispatch<SetStateAction<boolean>>;
}

const OrderDetailsStep: React.FC<OrderDetailsStepProps> = ({
  formData,
  onChange,
  errors = {},
  clients = [],
  loading = false,
  isAddingPan,
  setIsAddingPan,
}) => {
  // Debug log for initial render and props
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tags, setTags] = useState<WorkingTag[]>([]);
  const [pans, setPans] = useState<WorkingTag[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isCustomColor, setIsCustomColor] = useState(false);
  const addTagTriggerRef = useRef<HTMLButtonElement>(null);
  const [newTagData, setNewTagData] = useState({ name: "", color: "#000000" });
  const [editingTag, setEditingTag] = useState<WorkingTag | null>(null);
  const [isEditingTag, setIsEditingTag] = useState(false);

  const handleEditTag = async (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      setEditingTag(tag);
      setIsEditingTag(true);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !user) return;

    try {
      setLoading(true);
      const labId = await getLabIdByUserId(user.id);
      if (!labId) {
        throw new Error("No lab found for user");
      }

      const { error } = await supabase
        .from("working_tags")
        .update({
          name: editingTag.name,
          color: editingTag.color,
        })
        .eq("id", editingTag.id);

      if (error) throw error;

      // Update local state
      setTags(tags.map(tag => 
        tag.id === editingTag.id ? editingTag : tag
      ));

      setIsEditingTag(false);
      setEditingTag(null);
      toast.success("Tag updated successfully");
    } catch (error) {
      console.error("Error updating tag:", error);
      toast.error("Failed to update tag");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAddingPan(false);
      }
    };

    // Attach the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const WorkingTagSelect = ({
    value,
    onValueChange,
    tags,
    onEdit,
    onDelete,
  }: {
    value: string;
    onValueChange: (value: string) => void;
    tags: WorkingTag[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <Select 
        value={value} 
        onValueChange={onValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="bg-white">
          <SelectValue placeholder="Select Tag" className="text-gray-500">
            {value && tags.find(t => t.id === value) && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tags.find(t => t.id === value)?.color }}
                />
                <span>{tags.find(t => t.id === value)?.name || "Unnamed tag"}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent onCloseAutoFocus={(e) => e.preventDefault()} className="max-h-[200px] overflow-y-auto">
          {tags && tags.length > 0 ? (
            tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id} className="pr-24">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.name || "Unnamed tag"}</span>
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit(tag.id);
                      setIsOpen(false);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(tag.id);
                      setIsOpen(false);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="_no_tags" disabled>
              No tags available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    );
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
                Appointment Date & Time
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
                Status *
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
                        <SelectItem value="in_progress">In Progress</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS["in_progress"]}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="on_hold">On Hold</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS["on_hold"]}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="completed">Completed</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS["completed"]}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CASE_STATUS_DESCRIPTIONS["cancelled"]}</p>
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

            <div className="grid grid-cols-2 gap-5 w-full">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Working Pan</Label>
                  {/* <ColorPicker
                    mode="create"
                    selectedColor="#000000"
                    tags={[]}
                    type={"pan"}
                    setTags={setPans}
                    setPans={setPans}
                    pans={[]}
                    onClose={() => setIsAddingPan(false)}
                    initiallyOpen={isAddingPan}
                    trigger={
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTag(false);
                          setIsAddingPan(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add New
                      </button>
                    }
                  /> */}
                </div>
                <div className="relative">
                  <div className="flex gap-2 relative">
                    <Input
                      name="text"
                      placeholder="Enter the Pan"
                      value={formData.workingPanName}
                      onChange={(e) =>
                        onChange(
                          "workingPanName",
                          e.target.value || ("" as string)
                        )
                      }
                    />
                    <div
                      className="flex h-10 w-12 bg-gray-300 rounded-md cursor-pointer"
                      style={{
                        backgroundColor: formData.workingPanColor,
                      }}
                      onClick={() => setIsAddingPan(!isAddingPan)}
                    ></div>
                  </div>
                  {isAddingPan && (
                    <div
                      className="w-72 absolute top-12 bg-white p-2 z-50 border rounded-md"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <div className="flex justify-end py-2">
                        <button onClick={() => setIsAddingPan(false)}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className=" space-y-5 bg-white">
                        <div className="flex w-full gap-4">
                          <Button
                            size={"sm"}
                            onClick={() => setIsCustomColor(false)}
                            className="w-1/2"
                            variant={
                              isCustomColor ? "secondary" : "destructive"
                            }
                          >
                            Select Colors
                          </Button>
                          <Button
                            size={"sm"}
                            onClick={() => setIsCustomColor(true)}
                            className="w-1/2"
                            variant={
                              isCustomColor ? "destructive" : "secondary"
                            }
                          >
                            Select Custom Color
                          </Button>
                        </div>
                        {!isCustomColor ? (
                          <div className="grid grid-cols-5 gap-2 bg-white z-50">
                            {colors.map((item, key) => {
                              return (
                                <div
                                  key={key}
                                  className={`h-12 w-12 rounded-md cursor-pointer ${
                                    formData.workingPanColor === item
                                      ? "border-2 border-black"
                                      : ""
                                  }`}
                                  style={{
                                    backgroundColor: item,
                                  }}
                                  onClick={() =>
                                    onChange("workingPanColor", item)
                                  }
                                ></div>
                              );
                            })}
                          </div>
                        ) : (
                          <HexColorPicker
                            color={formData.workingPanColor || "#fffff"}
                            onChange={(color) =>
                              onChange("workingPanColor", color)
                            }
                            style={{ width: "100% !important" }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">Working Tag</Label>
                  <ColorPicker
                    mode="create"
                    selectedColor="#000000"
                    tags={[]}
                    setTags={setTags}
                    setPans={setPans}
                    pans={[]}
                    onClose={() => setIsAddingTag(false)}
                    initiallyOpen={isAddingTag}
                    type={"tag"}
                    trigger={
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPan(false);
                          setIsAddingTag(!isAddingTag);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        + New
                      </button>
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <WorkingTagSelect
                    value={formData.workingTagName || ""}
                    onValueChange={(value) => onChange("workingTagName", value)}
                    tags={tags}
                    onEdit={handleEditTag}
                    onDelete={(id) => {
                      const tagToDelete = tags.find(t => t.id === id);
                      if (tagToDelete) {
                        const confirmed = window.confirm(`Are you sure you want to delete the tag "${tagToDelete.name}"?`);
                        if (confirmed) {
                          // If the deleted tag is currently selected, clear the selection
                          if (formData.workingTagName === id) {
                            onChange("workingTagName", "");
                          }
                          // Remove the tag from the tags array
                          setTags(tags.filter(t => t.id !== id));
                          toast.success("Tag deleted successfully");
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Edit Tag Dialog */}
      <Dialog open={isEditingTag} onOpenChange={setIsEditingTag}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editingTag?.name || ""}
                onChange={(e) =>
                  setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <div
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full cursor-pointer border-2",
                      editingTag?.color === color
                        ? "border-black"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setEditingTag(prev => prev ? { ...prev, color } : null);
                      setIsCustomColor(false);
                    }}
                  />
                ))}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full cursor-pointer border-2 flex items-center justify-center",
                    isCustomColor ? "border-black" : "border-transparent"
                  )}
                  onClick={() => setIsCustomColor(true)}
                >
                  <Plus className="h-4 w-4" />
                </div>
              </div>
              {isCustomColor && (
                <div className="mt-2">
                  <HexColorPicker
                    className="w-full max-w-[200px]"
                    color={editingTag?.color || "#000000"}
                    onChange={(color) =>
                      setEditingTag(prev => prev ? { ...prev, color } : null)
                    }
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditingTag(false);
              setIsCustomColor(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag} disabled={isLoading}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderDetailsStep;
