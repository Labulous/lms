import React, { SetStateAction, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface OnHoldModalProps {
  isOpen: boolean;
  onHoldReason: string | null;
  setOnHoldReason: React.Dispatch<SetStateAction<string | null>>;
  onClose: () => void;
  handleUpdateCaseStatus: (type: string) => void;
}

const OnHoldModal = ({
  isOpen,
  onHoldReason,
  setOnHoldReason,
  onClose,
  handleUpdateCaseStatus,
}: OnHoldModalProps) => {
  const handleClose = () => {
    // Reset pointer-events on the body
    document.body.style.pointerEvents = "auto";
    setOnHoldReason(null); // Clear the reason
    onClose(); // Call the provided onClose function
  };

  useEffect(() => {
    // Ensure pointer-events are reset when the component unmounts
    return () => {
      document.body.style.pointerEvents = "auto";
    };
  }, []);
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-4xl"
        aria-describedby="dialog-onhold-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-onhold">Case on Hold</DialogTitle>
        </DialogHeader>

        {/* Add a hidden description for accessibility */}
        <p id="dialog-onhold-description" className="sr-only">
          Provide reasons for putting the case on hold in the text area below.
        </p>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Reasons for putting the case on hold?
            </h3>

            <textarea
              name="reasonNote"
              value={onHoldReason || ""}
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
