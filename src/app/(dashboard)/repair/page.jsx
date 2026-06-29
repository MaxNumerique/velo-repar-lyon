'use client'

import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RepairStepper } from '@/features/repair-request/components/RepairStepper';
import { StepUserInfo } from '@/features/repair-request/components/StepUserInfo';
import { StepBikeType } from '@/features/repair-request/components/StepBikeType';
import { StepServices } from '@/features/repair-request/components/StepServices';
import StepScheduling from '@/features/repair-request/components/StepScheduling';
import { StepValidation } from '@/features/repair-request/components/StepValidation';
import { RepairSummarySide } from '@/features/repair-request/components/RepairSummarySide';
import { useUser } from '@clerk/nextjs';
import { RepairProvider, useRepair } from '@/features/repair-request/context/RepairContext';

export default function RepairPage() {
  return (
    <RepairProvider>
      <RepairPageContent />
    </RepairProvider>
  );
}

function RepairPageContent() {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const {
    currentStep,
    isLoaded,
    nextStep,
    prevStep,
    validateStep
  } = useRepair();

  const handleSubmit = () => {
    router.push('/sign-up?redirect_url=/repair/confirm');
  };
  if (!isLoaded) return null;
  return (
    <div className="min-h-full bg-[#ebeced] pb-32">
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-md lg:max-w-6xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => {
              if (clerkUser) router.push('/interventions');
              else router.push('/');
            }} 
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="font-extrabold text-[#1e293b]">Nouvelle Réparation</h1>
          <div className="w-6" />
        </div>
      </div>
      <div className="max-w-md lg:max-w-6xl mx-auto px-6 pt-10">
        <RepairStepper currentStep={currentStep} />
        <div className="mt-8 mb-8 lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          <div className={`bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-6 shadow-sm ring-1 ring-slate-200 min-h-[400px] transition-all duration-500 ${
            currentStep === 5 ? 'lg:col-span-12' : 'lg:col-span-8'
          }`}>
            {currentStep === 1 && <StepBikeType />}
            {currentStep === 2 && <StepServices />}
            {currentStep === 3 && <StepUserInfo />}
            {currentStep === 4 && <StepScheduling />}
            {currentStep === 5 && <StepValidation />}
          </div>
          {currentStep < 5 && (
            <div className="hidden lg:block lg:col-span-4 sticky top-24 self-start animate-in fade-in slide-in-from-right-4 duration-700">
              <RepairSummarySide />
            </div>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
        <div className="max-w-md lg:max-w-2xl mx-auto flex gap-3">
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
          {currentStep < 5 ? (
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
    </div>
  );
}
