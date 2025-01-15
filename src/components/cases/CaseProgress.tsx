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
import { formatDate } from "@/lib/formatedDate";
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
export interface CaseStep {
  date: string;
  workstation_type?: string;
  dentist?: string;
  technician?: { name: string; id: string };
  status: "in_progress" | "completed" | "issue_reported";
  notes?: string;
  isNew?: boolean;
}

interface CaseProgressProps {
  steps?: CaseStep[];
  caseDetail: any;
  handleNewWorkstation: () => void;
  workstationForm: WorkstationForm;
  setWorkStationForm: React.Dispatch<SetStateAction<WorkstationForm>>;
  workStationTypes: WorkingStationTypes[];
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
}) => {
  const [technicians, setTechnicians] = useState<
    { name: string; id: string }[] | null
  >([]);
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
  return (
    <div className="relative">
      <div className="space-y-8">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const date = new Date(step.date);
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
                                    {step.workstation_type && (
                                      <div>
                                        <div className="text-sm text-gray-500 text-start">
                                          Workstation Type
                                        </div>
                                        <div className="font-medium text-start">
                                          {step.workstation_type}
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
                                    Created At:
                                  </p>
                                  <p className="font-medium">
                                    {caseDetail.created_by.name}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Created By:
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
                            <Card className="w-full">
                              <CardContent className="py-2 px-3">
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
                                            <SelectValue placeholder="Select client" />
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
                                      </div>
                                    </div>
                                    {workstationForm.workstation_type_id ===
                                    "custom-id" ? (
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
                                              setWorkStationForm(
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
                                    ) : (
                                      <div className="w-full"></div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <div>
                                    <div className="mt-5">
                                      <p className="text-sm text-gray-500">
                                        Notes:
                                      </p>
                                      <textarea
                                        name="notes"
                                        value={workstationForm.notes}
                                        onChange={(e: any) =>
                                          setWorkStationForm((prevState) => ({
                                            ...prevState, // Spread the previous state
                                            notes: e.target.value,
                                          }))
                                        }
                                        rows={3}
                                        className="border p-1 w-full"
                                      />
                                    </div>
                                  </div>
                                  <div className="h-full w-full flex justify-end items-end">
                                    <Button className="">Save</Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
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
                                        Done
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
                                <div className="flex w-full">
                                  {step.workstation_type && (
                                    <div>
                                      <div className="text-sm text-gray-500 text-start">
                                        Workstation Type
                                      </div>
                                      <div className="font-medium text-start">
                                        {step.workstation_type}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 border-t">
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div>
                                    <div>
                                      <p className="text-sm text-gray-500">
                                        Technician:
                                      </p>
                                      <p className="font-medium">
                                        {step.technician?.name}
                                      </p>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="mt-3"
                                      >
                                        <MoreHorizontal className="mr-2 h-4 w-4" />
                                        Actions
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem onClick={() => "alert"}>
                                        Pending
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        Report Bug
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        In Progress
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        Completed
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                <div>
                                  <div className="">
                                    <p className="text-sm text-gray-500">
                                      Notes:
                                    </p>
                                    <textarea
                                      name="notes"
                                      value={step.notes}
                                      onChange={(e: any) =>
                                        console.log(e.target.value)
                                      }
                                      rows={3}
                                      className="border p-1 w-full"
                                    />
                                  </div>
                                </div>
                                <div className="h-full w-full flex justify-end items-end">
                                  <Button className="">Save</Button>
                                </div>
                              </div>
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
