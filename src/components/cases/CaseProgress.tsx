import React from "react";
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
export interface CaseStep {
  date: string;
  condition?: string;
  treatment?: string;
  dentist?: string;
  technician?: { name: string; id: string };
  status: "in_queue" | "in_progress" | "completed" | "pending";
  notes?: string;
}

interface CaseProgressProps {
  steps?: CaseStep[];
}

const CaseProgress: React.FC<CaseProgressProps> = ({ steps = [] }) => {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex items-center justify-center p-4 text-gray-500">
        No progress steps available
      </div>
    );
  }

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
                  {step.status === "pending" && (
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
                            <div className="flex">
                              <div className="">
                                <div className="grid grid-cols-2 gap-4">
                                  {step.condition && (
                                    <div className="flex flex-col">
                                      <div className="text-sm text-gray-500 text-start">
                                        CONDITION
                                      </div>
                                      <div className="font-medium text-start">
                                        {step.condition}
                                      </div>
                                    </div>
                                  )}
                                  {step.treatment && (
                                    <div>
                                      <div className="text-sm text-gray-500 text-start">
                                        TREATMENT
                                      </div>
                                      <div className="font-medium text-start">
                                        {step.treatment}
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
                                      Done
                                    </span>
                                  )}
                                  {step.status === "pending" && (
                                    <span className="text-sm font-medium text-orange-500">
                                      Pending
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
                          </div>
                        ) : (
                          // If technician is not "System", render the Accordion with toggle functionality
                          <>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="w-full">
                                <div className="flex">
                                  <div className="w-full">
                                    <div className="grid grid-cols-2 gap-4">
                                      {step.condition && (
                                        <div className="flex flex-col">
                                          <div className="text-sm text-gray-500 text-start">
                                            CONDITION
                                          </div>
                                          <div className="font-medium text-start">
                                            {step.condition}
                                          </div>
                                        </div>
                                      )}
                                      {step.treatment && (
                                        <div>
                                          <div className="text-sm text-gray-500 text-start">
                                            TREATMENT
                                          </div>
                                          <div className="font-medium text-start">
                                            {step.treatment}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-2 flex items-center">
                                      {step.status === "completed" && (
                                        <span className="text-sm font-medium text-green-500">
                                          Done
                                        </span>
                                      )}
                                      {step.status === "pending" && (
                                        <span className="text-sm font-medium text-orange-500">
                                          Pending
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
          <Button>Create New Workstation</Button>
        </div>
      </div>
    </div>
  );
};

export default CaseProgress;
