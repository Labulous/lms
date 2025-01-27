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
import FilePreview from "./wizard/modals/FilePreview";
export interface CaseStep {
  id?: string;
  date?: string;
  workstation_type_id?: string;
  workstation_type_name?: string;
  dentist?: string;
  technician?: { name: string; id: string };
  status: "in_progress" | "completed" | "issue_reported" | "on_hold";
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
const ClientCaseProgress: React.FC<CaseProgressProps> = ({
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
  const [isFilePreview, setIsFilePreview] = useState<boolean>(false);
  const [files, setFiles] = useState<string[]>([]);
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
      } finally {
      }
    };
    getTechnicians();
  }, []);

  const handleSwitchToEdit = (id: string) => {
    const selectedWorkstation = steps.filter((item) => item.id === id)[0];

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
          : null,
      issue_reported_at:
        editWorkstationForm.status === "issue_reported"
          ? new Date().toISOString()
          : null,
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
                <div className="w-full">
                  {step.technician?.name === "System" ? (
                    <div>
                      The case has been created at{" "}
                      {formatDateWithTime(caseDetail.created_at)}
                    </div>
                  ) : (
                    <div>
                      {step.status === "completed" && (
                        <>
                          <span className="text-sm font-medium text-green-500">
                            Completed
                          </span>{" "}
                          {step.workstation_type_name} at{" "}
                          {formatDateWithTime(step.completed_at as string)}
                        </>
                      )}
                      {step.status === "issue_reported" && (
                        <>
                          <span className="text-sm font-medium text-orange-500">
                            Issue Reported
                          </span>{" "}
                          {step.workstation_type_name} at{" "}
                          {formatDateWithTime(step.issue_reported_at as string)}
                        </>
                      )}
                      {step.status === "in_progress" && (
                        <>
                          <span className="text-sm font-medium text-blue-500">
                            In Progress
                          </span>{" "}
                          {step.workstation_type_name} at{" "}
                          {formatDateWithTime(step.started_at as string)}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isFilePreview && (
        <FilePreview files={files} onClose={() => setIsFilePreview(false)} />
      )}
    </div>
  );
};

export default ClientCaseProgress;
