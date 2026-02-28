import React, { useRef, useEffect, useState } from "react";
import { ArrowLeftCircle, ArrowRightCircle, Camera, ArrowRight, X } from "lucide-react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import AnimatedBubbles from "./AnimatedBubbles";

// Gallery data with stories
const galleryImages = [
  {
    id: 1,
    src: "/images/gallery/norway_aurora.jpg",
    alt: "Aurora Borealis in Norway",
    caption: "Aurora Borealis in Norway",
    location: "Trondheim, Norway",
    date: "February 2024",
    story: "We were on a cabin trip near Trondheim, waiting for the lights under a clear sky, though the forecast gave us no chance before 11 PM. Around 22:55, my friend Iasonas made a bold prediction: the clouds would cover the shining moon, and the Northern Lights would appear in the north. Incredible as it sounds, it happened exactly as he foresaw. The moon vanished, and the sky lit up—an amazing night defying all probabilities."
  },
  {
    id: 2,
    src: "/images/gallery/asty_milky.jpg",
    alt: "Milky Way in Astypalea",
    caption: "Milky way core in Astypalea island",
    location: "Astypalea, Greece",
    date: "August 2023",
    story: "Astypalea is a tiny Greek island with almost no light pollution - perfect for astrophotography. I hiked to a remote spot and waited for the Milky Way core to rise. Around 2 AM, there it was - the galactic center in all its glory. The silence was complete, broken only by the distant sound of waves. I felt connected to something ancient and infinite. This shot took multiple exposures and hours of post-processing, but it captures exactly how magical that night felt."
  },
  {
    id: 3,
    src: "/images/gallery/ikaria_sunset.jpg",
    alt: "Sunset in Ikaria",
    caption: "Sunset in Ikaria island",
    location: "Ikaria, Greece",
    date: "July 2023",
    story: "Ikaria is known as the island where people forget to die - one of the world's Blue Zones. The pace of life here is different. I was sitting on a cliff with a glass of local wine when this sunset unfolded. The colors shifted from gold to pink to deep purple over an hour. There was no rush to capture the 'perfect' moment because every moment felt perfect. This photo reminds me that sometimes the best thing you can do is slow down and just be present."
  },
  {
    id: 4,
    src: "/images/gallery/asty_psarema.jpg",
    alt: "Fishing in Astypalea",
    caption: "Fishing in Astypalea island",
    location: "Astypalea, Greece",
    date: "August 2023",
    story: "We met a group of guys on the island who were the definition of relaxed. We joined them for a fishing session on a chill summer afternoon at Tzanakia beach. It was pure island vibes—easygoing conversation, the sound of the waves, and the simple fun of fishing with new friends. This photo captures that carefree spirit of Greek summer afternoons."
  },
  {
    id: 5,
    src: "/images/gallery/asty_sea.jpg",
    alt: "Sea view in Astypalea",
    caption: "Sea view in Astypalea island",
    location: "Astypalea, Greece",
    date: "August 2023",
    story: "The Aegean Sea has a color you won't find anywhere else - this deep, impossible blue that seems almost artificial. I found this secluded cove after a long hike down a cliff path. The water was so clear you could see the bottom 10 meters down. I spent the whole afternoon swimming and floating, feeling like I'd discovered a secret corner of the world. The stillness here was profound."
  },
  {
    id: 6,
    src: "/images/gallery/cph_proposal.jpg",
    alt: "Rosenborg Castle proposal",
    caption: "Rosenborg Castle proposal",
    location: "Copenhagen, Denmark",
    date: "March 2025",
    story: "I had been invited just to take casual photos of a couple visiting Copenhagen. There was absolutely no mention of a proposal. Then, right in front of Rosenborg Castle, he unexpectedly dropped to one knee. The surprise was genuine for everyone, myself included! I had to react instantly to capture the raw emotion of the moment. It remains one of my favorite unscripted captures."
  },
];

interface GalleryImage {
  id: number;
  src: string;
  alt: string;
  caption: string;
  location: string;
  date: string;
  story: string;
}

interface PhotoDetailDialogProps {
  photo: GalleryImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PhotoDetailDialog: React.FC<PhotoDetailDialogProps> = ({
  photo,
  open,
  onOpenChange,
}) => {
  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="overflow-hidden">
          <AnimatedBubbles />
        </DialogOverlay>

        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-h-[85vh] overflow-hidden p-0">
          <DialogPrimitive.Close className="absolute right-4 top-4 z-20 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          <div className="overflow-y-auto max-h-[85vh] p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{photo.caption}</DialogTitle>
              <VisuallyHidden.Root>
                <DialogDescription>
                  Story behind {photo.caption}
                </DialogDescription>
              </VisuallyHidden.Root>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>📍 {photo.location}</span>
                <span>📅 {photo.date}</span>
              </div>
            </DialogHeader>

            <div className="aspect-video overflow-hidden rounded-md mt-4">
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 mt-4">
              <div className="bg-background/80 backdrop-blur-sm rounded-md p-4">
                <h3 className="text-lg font-semibold mb-2">The Story</h3>
                <p className="text-muted-foreground leading-relaxed">{photo.story}</p>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

const Gallery = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryImage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      checkScroll();
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  const handleImageLoad = (id: number) => {
    setImagesLoaded(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const handlePhotoClick = (photo: GalleryImage) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 400;
    const currentScrollPosition = scrollContainerRef.current.scrollLeft;

    scrollContainerRef.current.scrollTo({
      left: direction === "left"
        ? currentScrollPosition - scrollAmount
        : currentScrollPosition + scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <section id="gallery" className="py-20 md:py-28 bg-secondary/50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12">
              <span className="badge bg-secondary text-secondary-foreground mb-4">
                Gallery
              </span>
              <h2 className="section-heading flex items-center">
                <Camera className="mr-2 h-8 w-8" /> Photography
              </h2>
              <p className="text-muted-foreground text-lg">
                Some of my favorite photographs from various adventures.
              </p>
            </div>

            <div className="relative">
              {showLeftArrow && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-background/80 rounded-full p-1 shadow-md hover:bg-background transition-colors"
                  aria-label="Scroll left"
                >
                  <ArrowLeftCircle className="h-8 w-8" />
                </button>
              )}

              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {galleryImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex-none w-80 glass-card overflow-hidden group hover-lift glow-effect cursor-pointer"
                    onClick={() => handlePhotoClick(image)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handlePhotoClick(image)}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={image.src}
                        alt={image.alt}
                        className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imagesLoaded[image.id] ? "opacity-100" : "opacity-0"
                          }`}
                        onLoad={() => handleImageLoad(image.id)}
                      />
                      {!imagesLoaded[image.id] && (
                        <div className="absolute inset-0 bg-secondary/20 animate-pulse" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-medium mb-2">{image.caption}</p>
                      <span className="inline-flex items-center text-xs font-medium text-primary group-hover:text-primary/80 transition-colors">
                        Read Story <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {showRightArrow && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-background/80 rounded-full p-1 shadow-md hover:bg-background transition-colors"
                  aria-label="Scroll right"
                >
                  <ArrowRightCircle className="h-8 w-8" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <PhotoDetailDialog
        photo={selectedPhoto}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

export default Gallery;