import { Check } from 'lucide-react';

const steps = [
  { id: 1, name: 'Le Vélo' },
  { id: 2, name: 'Prestation' },
  { id: 3, name: 'Informations' },
  { id: 4, name: 'Rendez-vous' },
  { id: 5, name: 'Validation' }
];

export function RepairStepper({ currentStep }) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex flex-col items-center relative">
            {/* Progression Line */}
            {index !== 0 && (
              <div 
                className={`absolute right-1/2 left-[-50%] top-5 h-0.5 -translate-y-1/2 transition-colors duration-500 ${
                  currentStep >= step.id ? 'bg-primary' : 'bg-slate-200'
                }`}
              />
            )}
            
            {/* Step Circle */}
            <div 
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                currentStep > step.id 
                  ? 'bg-primary border-primary text-white' 
                  : currentStep === step.id
                    ? 'border-primary bg-white text-primary ring-4 ring-primary/10'
                    : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {currentStep > step.id ? (
                <Check className="h-6 w-6" />
              ) : (
                <span className="text-sm font-bold">{step.id}</span>
              )}
            </div>
            
            {/* Step Label */}
            <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
              currentStep >= step.id ? 'text-slate-900' : 'text-slate-400'
            }`}>
              {step.id === 4 ? (
                <>
                  <span className="md:hidden">RDV</span>
                  <span className="hidden md:inline">Rendez-vous</span>
                </>
              ) : step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
