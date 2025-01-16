import React, { SetStateAction, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnHoldModalProps {
  onHoldReason: string;
  setOnHoldReason: React.Dispatch<SetStateAction<string>>;
  onClose: () => void;
  handleUpdateCaseStatus: (type: string) => void;
}

const OnHoldModal = ({
  onHoldReason,
  setOnHoldReason,
  onClose,
  handleUpdateCaseStatus,
}: OnHoldModalProps) => {
  useEffect(() => {
    // Ensure pointer-events are reset when the component unmounts
    return () => {
      document.body.style.pointerEvents = "auto";
    };
  }, []);

  const handleClose = () => {
    document.body.style.pointerEvents = "auto"; // Reset pointer-events
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={() => {
        handleClose();
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Case on Hold</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Reasons for putting the case on hold?
            </h3>

            <textarea
              name="reasonNote"
              value={onHoldReason}
              onChange={(e) => setOnHoldReason(e.target.value)}
              id="reasonNote"
              rows={3}
              className="border p-1 w-full rounded-md mt-2"
            ></textarea>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateCaseStatus("on_hold")}>
                Update
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnHoldModal;
