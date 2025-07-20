"use client";

import { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Image from "next/image";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dialogTitle?: string; // Added for accessibility
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  instantMeeting?: boolean;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  dialogTitle,
  className,
  children,
  handleClick,
  buttonText,
  // instantMeeting,
  image,
  // buttonClassName,
  buttonIcon,
}: MeetingModalProps) => {
  // Use the provided dialogTitle or fall back to the visible title
  const accessibleTitle = dialogTitle || title;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border-none bg-[#1C1F2E] px-6 py-9 text-white">
        {/* This DialogTitle is required for accessibility */}
        <DialogTitle className="sr-only">{accessibleTitle}</DialogTitle>
        
        <div className="flex flex-col gap-6">
          {image && (
            <div className="flex justify-center">
              <Image src={image} alt="checked" width={72} height={72} />
            </div>
          )}
          <h1 className={cn("text-3xl font-bold leading-[42px]", className)}>
            {title}
          </h1>
          {children}
          <Button
            className={
              "bg-[#0E78F9] focus-visible:ring-0 focus-visible:ring-offset-0"
            }
            onClick={handleClick}
          >
            {buttonIcon && (
              <Image
                src={buttonIcon}
                alt="button icon"
                width={13}
                height={13}
              />
            )}{" "}
            &nbsp;
            {buttonText || "Schedule Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;