'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/lib/notifications';

const STORAGE_KEY = 'velo_repair_request';

export default function RepairConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState('submitting'); // 'submitting', 'success', 'error'
  const [error, setError] = useState(null);
  const submitted = useRef(false);

  useEffect(() => {
    const submitRequest = async () => {
      // Prevent double submission in React Strict Mode (dev)
      if (submitted.current) return;
      submitted.current = true;

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setStatus('error');
        setError("Aucune donnée de demande trouvée.");
        return;
      }

      try {
        const data = JSON.parse(saved);
        
        // Prepare submission data
        const submissionData = {
          address: data.address,
          description: data.description || '',
          bikeType: data.bikeType,
          bikeModel: data.bikeModel || null,
          bikePhotos: data.bikePhotos || [],
          issuePhotos: data.issuePhotos || [],
          servicePackageId: data.servicePackageId,
          scheduledAt: data.scheduledAt,
          technicianId: data.technicianId,
          clientInfo: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email
          },
          products: (data.selectedProducts || []).map(p => ({
            id: p.id,
            quantity: p.quantity,
            price: p.price
          }))
        };

        const res = await fetch('/api/repair-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        });

        if (res.ok) {
          setStatus('success');
          localStorage.removeItem(STORAGE_KEY); // Clear data after success
          showToast.success("Demande enregistrée avec succès !");
        } else {
          const result = await res.json();
          throw new Error(result.error || "Erreur lors de la soumission");
        }
      } catch (err) {
        console.error('Submission error:', err);
        setStatus('error');
        setError(err.message);
        showToast.error("Échec de la soumission");
      }
    };

    submitRequest();
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#ebeced]">
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200 text-center animate-fade-in-up">
        {status === 'submitting' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Finalisation...</h2>
            <p className="text-slate-500">Nous enregistrons votre demande dans notre système.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="flex justify-center scale-110">
              <div className="bg-green-100 p-4 rounded-full ring-8 ring-green-50">
                <CheckCircle2 className="w-12 h-12 text-green-600 animate-in zoom-in duration-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900">C'est validé !</h2>
              <p className="text-slate-500">
                Votre demande de réparation a été transmise. Un technicien reviendra vers vous rapidement.
              </p>
            </div>
            <Button 
              onClick={() => router.push('/interventions')} 
              className="w-full h-14 rounded-[2rem] bg-primary font-bold shadow-lg"
            >
              Voir mes interventions
            </Button>
            <Button 
              variant="ghost"
              onClick={() => router.push('/')} 
              className="w-full text-slate-400 hover:text-slate-600"
            >
              Retour à l'accueil
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="bg-red-100 p-4 rounded-full ring-8 ring-red-50">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Oups !</h2>
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">
                {error || "Une erreur est survenue lors de l'enregistrement."}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => router.push('/repair')} 
                className="w-full h-12 rounded-[2rem] bg-slate-900 text-white font-bold"
              >
                Réessayer
              </Button>
              <Button 
                variant="ghost"
                onClick={() => router.push('/')} 
                className="text-slate-400"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
