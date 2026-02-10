'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function RepairOrderForm() {
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/repair-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, description }),
      });

      if (response.ok) {
        setStatus('success');
        setAddress('');
        setDescription('');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <Card className="max-w-md mx-auto border-green-100 bg-green-50/30">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <div className="space-y-2">
            <CardTitle className="text-green-800">Demande Envoyée !</CardTitle>
            <CardDescription className="text-green-700">
              Votre demande de réparation a été enregistrée. Un technicien vous contactera prochainement.
            </CardDescription>
          </div>
          <Button onClick={() => setStatus('idle')} variant="outline" className="mt-4">
            Nouvelle demande
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto shadow-xl border-t-4 border-t-blue-600">
      <CardHeader>
        <CardTitle className="text-2xl">Demander une réparation</CardTitle>
        <CardDescription>
          Renseignez votre adresse à Lyon et le problème rencontré sur votre vélo.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Votre adresse (Lyon uniquement)</Label>
            <Input
              id="address"
              placeholder="Ex: 10 rue de la République, 69002 Lyon"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="focus-visible:ring-blue-600"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description du problème</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre panne (freins, chaîne, dérailleur...)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[100px] focus-visible:ring-blue-600"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="terms" required />
            <label
              htmlFor="terms"
              className="text-xs text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              J'accepte que mes données soient utilisées pour le traitement de cette intervention.
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg transition-all active:scale-[0.98]"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer la demande'
            )}
          </Button>

          {status === 'error' && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Une erreur est survenue lors de l'envoi. Veuillez réessayer.</p>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
