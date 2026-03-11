'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairStepper } from '@/components/repair/RepairStepper';
import { StepUserInfo } from '@/components/repair/StepUserInfo';
import { StepBikeType } from '@/components/repair/StepBikeType';
import { StepServices } from '@/components/repair/StepServices';
import { StepProducts } from '@/components/repair/StepProducts';
import StepScheduling from '@/components/repair/StepScheduling';
import { StepValidation } from '@/components/repair/StepValidation';

const STORAGE_KEY = 'velo_repair_request';

export default function RepairPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing saved data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isLoaded]);

  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 6));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const validateStep = () => {
    if (currentStep === 1) {
      return (
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.address
      );
    }
    if (currentStep === 2) {
      return !!formData.bikeType;
    }
    if (currentStep === 3) {
      return !!formData.servicePackageId;
    }
    if (currentStep === 5) {
      return !!formData.scheduledAt;
    }
    return true;
  };

  const handleSubmit = () => {
    // Redirect to sign-up, forcing a return to the confirmation page
    router.push('/sign-up?redirect_url=/repair/confirm');
  };

  if (!isLoaded) return null;

  return (
    <main className="min-h-screen bg-[#ebeced] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-900 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-extrabold text-[#1e293b]">Nouvelle Réparation</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-6">
        <RepairStepper currentStep={currentStep} />

        <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-6 shadow-sm ring-1 ring-slate-200 min-h-[400px]">
          {currentStep === 1 && (
            <StepUserInfo data={formData} updateData={updateFormData} />
          )}
          {currentStep === 2 && (
            <StepBikeType data={formData} updateData={updateFormData} />
          )}
          {currentStep === 3 && (
            <StepServices data={formData} updateData={updateFormData} />
          )}
          {currentStep === 4 && (
            <StepProducts data={formData} updateData={updateFormData} />
          )}
          {currentStep === 5 && (
            <StepScheduling formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 6 && (
            <StepValidation data={formData} />
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200">
        <div className="max-w-md mx-auto flex gap-3">
          {currentStep > 1 && (
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              className="flex-1 h-14 rounded-[2rem] border-slate-200 font-bold"
            >
              Retour
            </Button>
          )}
          
          {currentStep < 6 ? (
            <Button
              size="lg"
              onClick={nextStep}
              disabled={!validateStep()}
              className="flex-[2] h-14 rounded-[2rem] bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold shadow-md transition-all active:scale-[0.98] group"
            >
              <span>Continuer</span>
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleSubmit}
              className="flex-[2] h-14 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-bold shadow-md transition-all active:scale-[0.98] group"
            >
              <span>Valider ma demande</span>
              <Check className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
