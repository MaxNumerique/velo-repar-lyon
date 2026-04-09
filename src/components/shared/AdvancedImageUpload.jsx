'use client'

import { useState, useRef } from 'react'
import { Camera, FileUp, X, Loader2, RotateCcw, Check, Paperclip, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { uploadToCloudinary } from '@/lib/cloudinary-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function AdvancedImageUpload({ 
  onSuccess, 
  label = "Image",
  className,
  multiple = false,
  maxFiles = 5,
  variant = "default" // 'default' or 'compact'
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const streamRef = useRef(null)

  // Start Camera
  const startCamera = async () => {
    setIsChoiceModalOpen(false)
    setIsCameraLoading(true)
    setIsCameraOpen(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Camera access error:", err)
      toast.error("Impossible d'accéder à la caméra")
      setIsCameraOpen(false)
    } finally {
      setIsCameraLoading(false)
    }
  }

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsCameraOpen(false)
    setCapturedImage(null)
  }

  // Capture Photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg')
      setCapturedImage(dataUrl)
    }
  }

  // Shared Upload Logic
  const handleUploadFiles = async (files) => {
    if (files.length === 0) return
    setIsUploading(true)
    setIsChoiceModalOpen(false)
    try {
      const uploadPromises = files.slice(0, multiple ? maxFiles : 1).map(file => uploadToCloudinary(file))
      const urls = await Promise.all(uploadPromises)
      urls.forEach(url => onSuccess({ info: { secure_url: url } }))
      toast.success(files.length > 1 ? "Images importées" : "Image importée")
    } catch (err) {
      toast.error("Erreur lors de l'envoi")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleUploadFiles(files)
  }

  // Handle Camera Upload
  const handleCameraUpload = async () => {
    if (!capturedImage) return
    setIsUploading(true)
    try {
      const url = await uploadToCloudinary(capturedImage)
      onSuccess({ info: { secure_url: url } })
      toast.success("Photo enregistrée")
      stopCamera()
    } catch (err) {
      toast.error("Erreur lors de l'envoi")
    } finally {
      setIsUploading(false)
    }
  }

  // Core Render Patterns
  const TriggerIcon = isUploading ? Loader2 : variant === 'compact' ? Paperclip : Upload
  
  const mainTrigger = (
    <button 
      type="button"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => setIsChoiceModalOpen(true)}
      disabled={isUploading}
      className={cn(
        "relative flex flex-col items-center justify-center transition-all duration-300",
        variant === 'compact' 
          ? "p-2 text-slate-400 hover:text-primary"
          : "w-full min-h-[120px] rounded-2xl border-2 border-dashed bg-slate-50/50 dark:bg-slate-900/50 group overflow-hidden",
        isDragging && "border-primary bg-primary/5 scale-[1.02]",
        !isDragging && "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
        isUploading && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(
        "flex flex-col items-center gap-2",
        variant === 'compact' ? "" : "p-4"
      )}>
        <div className={cn(
          "transition-transform duration-300",
          !variant === 'compact' && "p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110",
          isUploading && "animate-spin"
        )}>
          <TriggerIcon className={cn("w-5 h-5", variant === 'compact' ? "w-5 h-5" : "text-slate-400")} />
        </div>
        {variant !== 'compact' && (
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {isUploading ? "Envoi..." : isDragging ? "Déposer ici" : `Ajouter ${label}`}
            </span>
          </div>
        )}
      </div>

      {/* Dragging Overlay */}
      {isDragging && variant !== 'compact' && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in">
           <p className="text-primary text-xs font-bold uppercase tracking-tighter">Lâcher pour importer</p>
        </div>
      )}
    </button>
  )

  return (
    <>
      {mainTrigger}

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        multiple={multiple}
        onChange={(e) => handleUploadFiles(Array.from(e.target.files))}
      />

      {/* Choice Modal */}
      <Dialog open={isChoiceModalOpen} onOpenChange={setIsChoiceModalOpen}>
        <DialogContent className="sm:max-w-[400px] p-6 rounded-3xl gap-6">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">Importer une image</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4">
            {/* Dropzone inside modal */}
            <button
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-300 gap-3 group",
                isDragging ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
              )}
            >
              <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                <FileUp className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Parcourir mes fichiers</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Ou glisser-déposer</p>
              </div>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest leading-none bg-white px-2 text-slate-300">Ou</div>
            </div>

            <Button 
                onClick={startCamera} 
                variant="outline" 
                className="h-14 rounded-2xl gap-3 text-sm font-semibold hover:bg-slate-50"
            >
              <Camera className="w-5 h-5 text-slate-500" />
              Utiliser la caméra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={stopCamera} 
        capturedImage={capturedImage}
        setCapturedImage={setCapturedImage}
        isCameraLoading={isCameraLoading}
        isUploading={isUploading}
        videoRef={videoRef}
        canvasRef={canvasRef}
        onCapture={capturePhoto}
        onUpload={handleCameraUpload}
      />
    </>
  )
}

function CameraModal({ 
  isOpen, 
  onClose, 
  capturedImage, 
  setCapturedImage,
  isCameraLoading,
  isUploading,
  videoRef,
  canvasRef,
  onCapture,
  onUpload
}) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none gap-0 rounded-3xl">
        <DialogHeader className="absolute top-4 left-0 right-0 z-10 px-6 text-center pointer-events-none">
          <DialogTitle className="text-white text-sm font-medium flex items-center justify-center gap-2">
             Prendre une photo
          </DialogTitle>
        </DialogHeader>

        <div className="relative aspect-[3/4] w-full bg-slate-950 flex items-center justify-center">
          {isCameraLoading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-white/50" />
              <span className="text-white/40 text-xs font-medium">Initialisation caméra...</span>
            </div>
          )}
          
          {!capturedImage ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className={cn("w-full h-full object-cover grayscale-[0.2] contrast-[1.1]", isCameraLoading && "opacity-0")}
            />
          ) : (
            <img 
              src={capturedImage} 
              className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-300"
              alt="Captured"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
        </div>

        <div className="bg-black p-8 flex items-center justify-center gap-8 relative">
          {!capturedImage ? (
            <button 
              onClick={onCapture}
              className="w-16 h-16 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white shadow-lg flex items-center justify-center" />
            </button>
          ) : (
            <div className="flex items-center gap-12 animate-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setCapturedImage(null)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-colors">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Reprendre</span>
              </button>

              <button 
                onClick={onUpload}
                disabled={isUploading}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/20 group-hover:scale-105 active:scale-95 transition-all">
                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-8 h-8" />}
                </div>
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">Valider</span>
              </button>
            </div>
          )}

          {!capturedImage && (
              <button 
                  onClick={onClose}
                  className="absolute left-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                  <X className="w-5 h-5" />
              </button>
          )}
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
