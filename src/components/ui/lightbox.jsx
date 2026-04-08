"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Lightbox using a nested Radix Dialog.
 * Radix natively handles stacking: closing this dialog won't close the parent one.
 */
export function Lightbox({ photos = [], initialIndex = 0, open, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  const prevPhoto = () =>
    setIndex((prev) => (prev - 1 + photos.length) % photos.length);
  const nextPhoto = () => setIndex((prev) => (prev + 1) % photos.length);

  if (!photos.length) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !m-0 !rounded-none bg-black/95 backdrop-blur-md border-none !p-0 flex items-center justify-center !z-[200] cursor-zoom-out"
      >
        <DialogTitle className="sr-only">Galerie photo</DialogTitle>
        <DialogDescription className="sr-only">
          Visualisation en plein écran des photos de l'intervention.
        </DialogDescription>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
          aria-label="Fermer"
        >
          <X className="w-7 h-7" />
        </button>

        {/* Navigation arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          </>
        )}

        {/* Image */}
        <img
          src={photos[index]}
          alt={`Photo ${index + 1}`}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-300 cursor-default"
        />

        {/* Counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
          {index + 1} / {photos.length}
        </div>

        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === index ? "bg-white w-4" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
