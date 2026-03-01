import React from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Badge } from "@/components/ui/badge";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import AnimatedBubbles from "./AnimatedBubbles";
import { X } from "lucide-react";

interface ProjectDetailDialogProps {
  project: {
    id: number;
    title: string;
    description: string;
    tags: string[];
    image: string;
    detailedDescription?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDetailDialog: React.FC<ProjectDetailDialogProps> = ({
  project,
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Custom overlay with animated bubbles */}
        <DialogOverlay className="overflow-hidden">
          <AnimatedBubbles />
        </DialogOverlay>

        {/* Dialog content - using DialogPrimitive.Content to avoid duplicate overlay */}
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[85vh] overflow-hidden p-0">
          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-4 z-20 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Scrollable content container */}
          <div className="overflow-y-auto max-h-[85vh] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{project.title}</DialogTitle>
              <VisuallyHidden.Root>
                <DialogDescription>
                  Details about {project.title}
                </DialogDescription>
              </VisuallyHidden.Root>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.tags.map((tag, i) => (
                  <Badge key={i} className="bg-secondary text-secondary-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </DialogHeader>

            {project.image && (
              <div className="aspect-video overflow-hidden rounded-md mt-4">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-4 mt-4">
              <p className="text-muted-foreground">{project.description}</p>

              {project.detailedDescription && (
                <div className="bg-background/80 backdrop-blur-sm rounded-md p-4">
                  <h3 className="text-lg font-semibold mb-2">Detailed Overview</h3>
                  <p className="text-muted-foreground">{project.detailedDescription}</p>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ProjectDetailDialog;
