import React, { SetStateAction, useEffect, useState } from "react";
import { CheckCircle2, Clock, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatDateWithTime } from "@/lib/formatedDate";
import { WorkingStationTypes, WorkstationForm } from "@/types/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { supabase } from "@/lib/supabase";
import { getLabIdByUserId } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import FileUploads from "./wizard/steps/FileUploads";
import { FileWithStatus } from "./wizard/steps/FilesStep";
export interface CaseStep {
  id?: string;
  date?: string;
  workstation_type_id?: string;
  workstation_type_name?: string;
  dentist?: string;
  technician?: { name: string; id: string };
  status: "in_progress" | "completed" | "issue_reported";
  notes?: string;
  custom_workstation_type?: string;
  isNew?: boolean;
  started_at?: string;
  completed_at?: string;
  issue_reported_at?: string;
  created_by?: {
    name?: string;
  };
  isEditOn?: boolean;
  started_notes?: string;
  completed_notes?: string;
  issue_reported_notes?: string;
  files?: string[];
}

interface CaseProgressProps {
  steps?: CaseStep[];
  setSteps: React.Dispatch<SetStateAction<CaseStep[]>>;
  caseDetail: any;
  handleNewWorkstation: () => void;
  workstationForm: WorkstationForm;
  setWorkStationForm: React.Dispatch<SetStateAction<WorkstationForm>>;
  workStationTypes: WorkingStationTypes[];
  handleSubmitWorkstation: () => void;
  isLoading: boolean;
  setLoading: React.Dispatch<SetStateAction<boolean>>;
  getWorkStationDetails: (case_created_at: string) => void;
  caseId: string;
  caseCreatedAt: string;
  selectedFiles: FileWithStatus[];
  setSelectedFiles: React.Dispatch<SetStateAction<FileWithStatus[]>>;
}

const status = [
  {
    value: "in_progress",
    name: "In Progress",
  },
  {
    value: "completed",
    name: "Completed",
  },
  {
    value: "issue_reported",
    name: "Issue Report",
  },
];
const CaseProgress: React.FC<CaseProgressProps> = ({
  steps = [],
  caseDetail,
  handleNewWorkstation,
  workstationForm,
  setWorkStationForm,
  workStationTypes,
  handleSubmitWorkstation,
  setSteps,
  isLoading,
  setLoading,
  getWorkStationDetails,
  caseCreatedAt,
  selectedFiles,
  setSelectedFiles,
}) => {
  const [technicians, setTechnicians] = useState<
    { name: string; id: string }[] | null
  >([]);

  const [editWorkstationForm, setEditWorkStationForm] = useState<CaseStep>({
    custom_workstation_type: "",
    status: "in_progress" as "in_progress" | "completed" | "issue_reported",
    started_notes: "",
    completed_notes: "",
    issue_reported_notes: "",
    completed_at: "",
    issue_reported_at: "",
    workstation_type_id: "",
    workstation_type_name: "",
    technician: {
      id: "",
      name: "",
    },
  });
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        No progress steps available
      </div>
    );
  }
  const { user } = useAuth();
  useEffect(() => {
    const getTechnicians = async () => {
      try {
        const lab = await getLabIdByUserId(user?.id as string);
        if (!lab?.labId) {
          console.error("Lab ID not found.");
          return;
        }

        const { data: technicians, error: techniciansError } = await supabase
          .from("users")
          .select(
            `
name,
id
          `
          )
          .eq("lab_id", lab.labId)
          .eq("role", "technician");

        if (techniciansError) {
          toast.error("faild to fetch Technicians!!!");
        }

        setTechnicians(technicians);
      } catch (err) {
        console.log(err, "error");
      } finally {
        console.log("fetched technicians");
      }
    };
    getTechnicians();
  }, []);
  console.log(steps, "steps");
  console.log(workStationTypes, "types");
  const handleSwitchToEdit = (id: string) => {
    const selectedWorkstation = steps.filter((item) => item.id === id)[0];
    console.log(selectedWorkstation, "Selected");

    const editItem = {
      custom_workstation_type: selectedWorkstation.custom_workstation_type,
      status: selectedWorkstation.status,
      started_notes: selectedWorkstation.started_notes,
      completed_notes: selectedWorkstation.completed_notes,
      issue_reported_notes: selectedWorkstation.issue_reported_notes,
      completed_at: selectedWorkstation.completed_at,
      issue_reported_at: selectedWorkstation.issue_reported_at,
      workstation_type_id:
        selectedWorkstation.workstation_type_id || "custom-id",
      workstation_type_name:
        selectedWorkstation.workstation_type_name || "custom-id",
      technician: {
        id: selectedWorkstation.technician?.id as string,
        name: selectedWorkstation.technician?.name as string,
      },
    };

    setSteps((prev) =>
      prev.map(
        (item) =>
          item.id === id
            ? { ...item, isEditOn: true } // Set isEditOn to true for the selected workstation
            : { ...item, isEditOn: false } // Set isEditOn to false for the rest
      )
    );
    setEditWorkStationForm(editItem);
    setSteps((prev) =>
      prev.map(
        (item) =>
          item.id === id
            ? { ...item, isEditOn: true } // Set isEditOn to true for the selected workstation
            : { ...item, isEditOn: false } // Set isEditOn to false for the rest
      )
    );

    const files = selectedWorkstation.files
      ? selectedWorkstation.files.map((item) => {
          return { url: item as string }; // Explicitly return an object with the `url`
        })
      : [];
    setSelectedFiles(files);
  };

  const handleUpdateWorkstation = async (id: string) => {
    // Validation for required fields
    if (
      !editWorkstationForm.status ||
      !editWorkstationForm.workstation_type_id ||
      (editWorkstationForm.workstation_type_id === "custom-id" &&
        !editWorkstationForm.custom_workstation_type)
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Create the dataToFeed object
    const dataToUpdate = {
      status: editWorkstationForm.status,
      technician_id: editWorkstationForm.technician?.id,
      completed_at:
        editWorkstationForm.status === "completed"
          ? new Date().toISOString()
          : null, // Valid timestamp
      issue_reported_at:
        editWorkstationForm.status === "issue_reported"
          ? new Date().toISOString()
          : null, // Valid timestamp
      workstation_type_id:
        editWorkstationForm.workstation_type_id === "custom-id"
          ? null
          : editWorkstationForm.workstation_type_id,
      custom_workstation_type: editWorkstationForm.custom_workstation_type
        ? editWorkstationForm.custom_workstation_type
        : null, // Optional field
      started_notes: editWorkstationForm.started_notes,
      completed_notes: editWorkstationForm.completed_notes,
      issue_reported_notes: editWorkstationForm.issue_reported_notes,
      attachements: selectedFiles.map((item) => item.url),
    };
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("workstation_log")
        .update(dataToUpdate)
        .eq("id", id);

      if (updateError) {
        toast.error("Failed to Update the workstation");
      }

      toast.success("Workstation Updated Successfully!");
      setLoading(false);
      getWorkStationDetails(caseCreatedAt);
    } catch (err) {
      toast.error("Failed to Update the workstation");
      setLoading(false);
    }
  };
  console.log(steps, "setpps");

  const handleCancelNewWorkstation = () => {
    setSteps((prev) => prev.filter((step) => step.isNew !== true));
  };

  return (
    <div className="relative">
      <div className="space-y-8">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const date = step?.date ? new Date(step?.date) : new Date();
          const month = date
            .toLocaleString("default", { month: "short" })
            .toUpperCase();
          const day = date.getDate();

          return (
            <div key={index} className="relative">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-7 top-14 w-0.5 h-full -ml-px",
                    step.status === "completed" ? "bg-green-200" : "bg-gray-200"
                  )}
                />
              )}

              <div className="flex items-start space-x-4">
                {/* Date column */}
                <div className="min-w-[50px] text-center">
                  <div className="text-sm font-medium text-gray-500">
                    {month}
                  </div>
                  <div className="text-2xl font-semibold">{day}</div>
                </div>

                {/* Status icon */}
                <div className="relative flex items-center justify-center">
                  {step.status === "completed" && (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  )}
                  {step.status === "issue_reported" && (
                    <Clock className="w-6 h-6 text-orange-500" />
                  )}
                  {step.status === "in_progress" && (
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <Card className="w-full">
                  <CardContent className="py-2 px-3">
                    <Accordion type="single" collapsible>
                      <AccordionItem
                        value="instructions"
                        className="border-none"
                      >
                        {step.technician?.name === "System" ? (
                          // If technician is "System", render the content directly without toggle
                          <div className="w-full">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex">
                                <div className="">
                                  <div className="grid grid-cols-2 gap-4">
                                    {step.workstation_type_name && (
                                      <div>
                                        <div className="text-sm text-gray-500 text-start">
                                          Workstation Type
                                        </div>
                                        <div className="font-medium text-start">
                                          {step.workstation_type_name}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {step.notes && (
                                    <div className="mt-2 text-sm text-gray-600 text-start">
                                      {step.notes}
                                    </div>
                                  )}
                                  <div className="mt-2 flex items-center">
                                    {step.status === "completed" && (
                                      <span className="text-sm font-medium text-green-500">
                                        Completed
                                      </span>
                                    )}
                                    {step.status === "issue_reported" && (
                                      <span className="text-sm font-medium text-orange-500">
                                        Issue Reported
                                      </span>
                                    )}
                                    {step.status === "in_progress" && (
                                      <span className="text-sm font-medium text-blue-500">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 border-t">
                              <div className=" flex justify-between items-center">
                                <div className="">
                                  <p className="text-sm text-gray-500">
                                    Created By:
                                  </p>
                                  <p className="font-medium">
                                    {caseDetail.created_by.name}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Created At:
                                  </p>
                                  <p className="font-medium">
                                    {formatDate(caseDetail.created_at)}
                                  </p>
                                </div>
                              </div>
                            </AccordionContent>
                          </div>
                        ) : step.isNew ? (
                          <>
                            <CardContent className="p-0 pt-5">
                              <div className="flex flex-col justify-between w-full">
                                <div className="flex justify-between w-full gap-5">
                                  <div className="w-full space-y-2">
                                    <div className="text-sm text-gray-500 text-start">
                                      Select Status
                                    </div>
                                    <div>
                                      <Select
                                        value={workstationForm.status}
                                        onValueChange={(value) => {
                                          setWorkStationForm((prevState) => ({
                                            ...prevState, // Spread the previous state
                                            status: value as
                                              | "in_progress"
                                              | "completed"
                                              | "issue_reported",
                                          }));
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {status.slice(0, 1).map((status) => (
                                            <SelectItem
                                              key={status.value}
                                              value={status.value}
                                            >
                                              {status.name}
                                            </SelectItem>
                                          ))}{" "}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="w-full space-y-2">
                                    <div className="text-sm text-gray-500 text-start">
                                      Select Workstation Type
                                    </div>
                                    <div>
                                      <Select
                                        value={
                                          workstationForm.workstation_type_id
                                        }
                                        onValueChange={(value) => {
                                          setWorkStationForm((prevState) => ({
                                            ...prevState, // Spread the previous state
                                            workstation_type_id: value as
                                              | "in_progress"
                                              | "completed"
                                              | "issue_reported",
                                          }));
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {workStationTypes.map((type) => (
                                            <SelectItem
                                              key={type.id}
                                              value={type.id}
                                            >
                                              {type.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex w-full gap-5 mt-5">
                                  <div className="w-full space-y-2">
                                    <div className="text-sm text-gray-500 text-start">
                                      Select Technician
                                    </div>
                                    <div>
                                      {workstationForm.created_by ===
                                      workstationForm.technician_id ? (
                                        <div className="font-medium text-start">
                                          {step.technician?.name}
                                        </div>
                                      ) : (
                                        <Select
                                          value={workstationForm.technician_id}
                                          onValueChange={(value) => {
                                            setWorkStationForm((prevState) => ({
                                              ...prevState, // Spread the previous state
                                              technician_id: value,
                                            }));
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select Technician" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {technicians &&
                                              technicians.map((tech) => (
                                                <SelectItem
                                                  key={tech.id}
                                                  value={tech.id}
                                                >
                                                  {tech.name}
                                                </SelectItem>
                                              ))}{" "}
                                          </SelectContent>
                                        </Select>
                                      )}
                                    </div>
                                  </div>
                                  {workstationForm.workstation_type_id ===
                                    "custom-id" && (
                                    <div className="w-full space-y-2">
                                      <div className="text-sm text-gray-500 text-start">
                                        Custom Workstation Type
                                      </div>
                                      <div>
                                        <Input
                                          type="text"
                                          id="customWorkStationType"
                                          name="customWorkStationType"
                                          placeholder="Custom Work station Type"
                                          value={
                                            workstationForm.custom_workstation_type
                                          }
                                          onChange={(e: any) =>
                                            setWorkStationForm((prevState) => ({
                                              ...prevState, // Spread the previous state
                                              custom_workstation_type:
                                                e.target.value,
                                            }))
                                          }
                                          className={cn("bg-white")}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="mt-5">
                                    <p className="text-sm text-gray-500">
                                      Started Notes:
                                    </p>
                                    <textarea
                                      name="notes"
                                      value={workstationForm.started_notes}
                                      onChange={(e: any) =>
                                        setWorkStationForm((prevState) => ({
                                          ...prevState, // Spread the previous state
                                          started_notes: e.target.value,
                                        }))
                                      }
                                      rows={3}
                                      className="border p-1 w-full rounded-md mt-2"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-4 mt-5">
                                <FileUploads
                                  selectedFiles={selectedFiles}
                                  setSelectedFiles={setSelectedFiles}
                                  storage="workstation"
                                />
                              </div>

                              <div className="h-full w-full flex justify-end items-end gap-5">
                                <Button
                                  disabled={isLoading}
                                  onClick={() => handleCancelNewWorkstation()}
                                  variant={"outline"}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  className=""
                                  disabled={isLoading}
                                  onClick={() => handleSubmitWorkstation()}
                                >
                                  Save
                                </Button>
                              </div>
                            </CardContent>
                          </>
                        ) : (
                          // If technician is not "System", render the Accordion with toggle functionality
                          <>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex justify-between w-full">
                                <div className="w-full">
                                  <div className="text-sm text-gray-500 text-start">
                                    Status
                                  </div>
                                  <div className="mt-2 flex items-center">
                                    {step.status === "completed" && (
                                      <span className="text-sm font-medium text-green-500">
                                        Completed
                                      </span>
                                    )}
                                    {step.status === "issue_reported" && (
                                      <span className="text-sm font-medium text-orange-500">
                                        Issue Reported
                                      </span>
                                    )}
                                    {step.status === "in_progress" && (
                                      <span className="text-sm font-medium text-blue-500">
                                        In Progress
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {step.workstation_type_name && (
                                  <div className="flex w-full">
                                    <div>
                                      <div className="text-sm text-gray-500 text-start">
                                        Workstation Type
                                      </div>
                                      <div className="font-medium text-start">
                                        {step.workstation_type_name}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {step.custom_workstation_type && (
                                  <div className="flex w-full">
                                    <div>
                                      <div className="text-sm text-gray-500 text-start">
                                        Workstation Type
                                      </div>
                                      <div className="font-medium text-start">
                                        {step.custom_workstation_type}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="border-t p-1 pt-5">
                              <div className="grid grid-cols-2 gap-5 w-full">
                                <div className="w-full space-y-2">
                                  <div className="text-sm text-gray-500 text-start">
                                    Select Status
                                  </div>
                                  <div>
                                    <Select
                                      value={
                                        !step.isEditOn
                                          ? step.status
                                          : editWorkstationForm.status
                                      }
                                      disabled={!step.isEditOn}
                                      onValueChange={(value) => {
                                        setEditWorkStationForm((prevState) => ({
                                          ...prevState, // Spread the previous state
                                          status: value as
                                            | "in_progress"
                                            | "completed"
                                            | "issue_reported",
                                        }));
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {status.map((status) => (
                                          <SelectItem
                                            key={status.value}
                                            value={status.value}
                                          >
                                            {status.name}
                                          </SelectItem>
                                        ))}{" "}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="w-full space-y-2">
                                  <div className="text-sm text-gray-500 text-start">
                                    Select Workstation Type
                                  </div>
                                  <div>
                                    <Select
                                      value={
                                        step.isEditOn
                                          ? editWorkstationForm.workstation_type_id
                                          : step.workstation_type_id ||
                                            "custom-id"
                                      }
                                      disabled={!step.isEditOn}
                                      onValueChange={(value) => {
                                        setEditWorkStationForm((prevState) => ({
                                          ...prevState, // Spread the previous state
                                          workstation_type_id: value,
                                        }));
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {workStationTypes.map((type) => (
                                          <SelectItem
                                            key={type.id}
                                            value={type.id}
                                          >
                                            {type.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <div className="w-full space-y-2">
                                  <div className="text-sm text-gray-500 text-start">
                                    Select Technician
                                  </div>
                                  <div>
                                    {workstationForm.created_by ===
                                    workstationForm.technician_id ? (
                                      <div className="font-medium text-start">
                                        {step.technician?.name}
                                      </div>
                                    ) : (
                                      <Select
                                        value={
                                          !step.isEditOn
                                            ? step.technician?.id
                                            : (editWorkstationForm?.technician
                                                ?.id as string)
                                        }
                                        disabled={!step.isEditOn}
                                        onValueChange={(value) => {
                                          setEditWorkStationForm(
                                            (prevState) => ({
                                              ...prevState, // Spread the previous state
                                              technician: {
                                                id: value,
                                                name: step.technician
                                                  ?.name as string,
                                              },
                                            })
                                          );
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select Technician" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {technicians &&
                                            technicians.map((tech) => (
                                              <SelectItem
                                                key={tech.id}
                                                value={tech.id}
                                              >
                                                {tech.name}
                                              </SelectItem>
                                            ))}{" "}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>

                                {step.isEditOn &&
                                  editWorkstationForm.workstation_type_id ===
                                    "custom-id" && (
                                    <div className="w-full space-y-2">
                                      <div className="w-full space-y-2">
                                        <div className="text-sm text-gray-500 text-start">
                                          Custom Workstation Type
                                        </div>
                                        <div>
                                          <Input
                                            type="text"
                                            id="customWorkStationType"
                                            name="customWorkStationType"
                                            disabled={!step.isEditOn}
                                            placeholder="Custom Work station Type"
                                            value={
                                              step.isEditOn
                                                ? editWorkstationForm.custom_workstation_type
                                                : step.custom_workstation_type
                                            }
                                            onChange={(e: any) =>
                                              setEditWorkStationForm(
                                                (prevState) => ({
                                                  ...prevState, // Spread the previous state
                                                  custom_workstation_type:
                                                    e.target.value,
                                                })
                                              )
                                            }
                                            className={cn("bg-white")}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                {!step.isEditOn &&
                                  !step.workstation_type_id && (
                                    <div className="w-full space-y-2">
                                      <div className="w-full space-y-2">
                                        <div className="text-sm text-gray-500 text-start">
                                          Custom Workstation Type
                                        </div>
                                        <div>
                                          <Input
                                            type="text"
                                            id="customWorkStationType"
                                            name="customWorkStationType"
                                            disabled={!step.isEditOn}
                                            placeholder="Custom Work station Type"
                                            value={
                                              step.isEditOn
                                                ? editWorkstationForm.custom_workstation_type
                                                : step.custom_workstation_type
                                            }
                                            onChange={(e: any) =>
                                              setEditWorkStationForm(
                                                (prevState) => ({
                                                  ...prevState, // Spread the previous state
                                                  custom_workstation_type:
                                                    e.target.value,
                                                })
                                              )
                                            }
                                            className={cn("bg-white")}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                {step.started_at && (
                                  <div className="w-full space-y-2">
                                    <div className="w-full space-y-2">
                                      <div className="text-sm text-gray-500 text-start">
                                        Started At
                                      </div>
                                      <div>
                                        {formatDateWithTime(step.started_at)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {step.issue_reported_at && (
                                  <div className="w-full space-y-2">
                                    <div className="w-full space-y-2">
                                      <div className="text-sm text-gray-500 text-start">
                                        Reported At
                                      </div>
                                      {formatDateWithTime(
                                        step.issue_reported_at
                                      )}
                                      <div></div>
                                    </div>
                                  </div>
                                )}
                                {step.completed_at && (
                                  <div className="w-full space-y-2">
                                    <div className="w-full space-y-2">
                                      <div className="text-sm text-gray-500 text-start">
                                        Completed At
                                      </div>
                                      <div>
                                        {formatDateWithTime(step.completed_at)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {step.created_by && (
                                  <div className="w-full space-y-2">
                                    <div className="w-full space-y-2">
                                      <div className="text-sm text-gray-500 text-start">
                                        Created By
                                      </div>
                                      <div>{step?.created_by?.name}</div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {!step.isEditOn && (
                                <div className="space-y-4">
                                  <div>
                                    <div className="mt-5">
                                      <p className="text-sm text-gray-500">
                                        {step.status === "in_progress"
                                          ? "Started Notes"
                                          : step.status === "completed"
                                          ? "Completed Notes"
                                          : "Issue Reported Notes"}
                                      </p>
                                      <textarea
                                        name="notes"
                                        value={
                                          step.isEditOn
                                            ? editWorkstationForm.status ===
                                              "in_progress"
                                              ? editWorkstationForm.started_notes
                                              : editWorkstationForm.status ===
                                                "completed"
                                              ? editWorkstationForm.completed_notes
                                              : editWorkstationForm.issue_reported_notes
                                            : step.status === "in_progress"
                                            ? step.started_notes
                                            : step.status === "completed"
                                            ? step.completed_notes
                                            : step.issue_reported_notes
                                        }
                                        onChange={(e: any) =>
                                          setWorkStationForm((prevState) => ({
                                            ...prevState, // Spread the previous state
                                            notes: e.target.value,
                                          }))
                                        }
                                        rows={3}
                                        disabled={true}
                                        className="border p-1 w-full rounded-md mt-2"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {step.isEditOn && (
                                <>
                                  <div>
                                    <div className="mt-5">
                                      {/* Map over notes based on the status */}
                                      {[
                                        "in_progress",
                                        "completed",
                                        "issue_reported",
                                      ]
                                        .sort((a, b) =>
                                          a === editWorkstationForm.status
                                            ? -1
                                            : 1
                                        ) // Ensure the selected one appears first
                                        .map((statusType) => {
                                          const isActive =
                                            editWorkstationForm.status ===
                                            statusType;
                                          const noteKey =
                                            statusType === "in_progress"
                                              ? "started_notes"
                                              : statusType === "completed"
                                              ? "completed_notes"
                                              : "issue_reported_notes";

                                          return (
                                            <div key={statusType}>
                                              <p className="text-sm text-gray-500 mt-2">
                                                {statusType === "in_progress"
                                                  ? "Started Notes"
                                                  : statusType === "completed"
                                                  ? "Completed Notes"
                                                  : "Issue Reported Notes"}
                                              </p>
                                              <textarea
                                                name="notes"
                                                value={
                                                  editWorkstationForm[
                                                    noteKey
                                                  ] || ""
                                                }
                                                onChange={(e) =>
                                                  setEditWorkStationForm(
                                                    (prevState) => ({
                                                      ...prevState,
                                                      [noteKey]: e.target.value, // Update the correct note based on the status
                                                    })
                                                  )
                                                }
                                                rows={3}
                                                className="border p-1 w-full rounded-md mt-2"
                                              />
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                </>
                              )}
                              {step.isEditOn && (
                                <FileUploads
                                  selectedFiles={selectedFiles}
                                  setSelectedFiles={setSelectedFiles}
                                  storage="workstation"
                                />
                              )}
                              <div className="h-full w-full flex justify-end items-end">
                                <Button
                                  className=""
                                  disabled={isLoading}
                                  onClick={() =>
                                    step.isEditOn === false
                                      ? handleSwitchToEdit(step?.id as string)
                                      : handleUpdateWorkstation(
                                          step?.id as string
                                        )
                                  }
                                >
                                  {step.isEditOn ? "Save" : "Edit"}
                                </Button>
                              </div>

                              {!step.isEditOn && (
                                <div className="flex flex-col gap-4 space-y-2">
                                  <div className="text-sm text-gray-500 text-start flex">
                                    Attachements: {" "}
                                    <p className="font-bold">{(step.files && step.files.length) || 0}</p>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    {step.files &&
                                      step.files.map((item, index) => {
                                        return (
                                          <div key={index}>
                                            <img
                                              src={item}
                                              height={100}
                                              width={100}
                                              alt="file"
                                              className="rounded-md border p-2 w-32 h-20"
                                            />
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </AccordionContent>
                          </>
                        )}
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
        <div className="flex justify-end items-end">
          <Button onClick={() => handleNewWorkstation()}>
            Create New Workstation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaseProgress;
