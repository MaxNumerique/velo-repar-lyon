import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  SignedIn, 
  SignedOut, 
  SignOutButton 
} from '@clerk/nextjs'
import { ChevronRight, LogIn, LayoutDashboard, LogOut } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#ebeced] text-[#1e293b]">
      <div className="w-full max-w-sm flex flex-col items-center gap-10 animate-fade-in-up">
        <div className="bg-white p-4 rounded-[2.5rem] shadow-sm ring-1 ring-slate-200">
          <Image
            src="/velodupelo.png"
            alt="Vélo du Pélo Logo"
            width={140}
            height={140}
            className="rounded-[2rem]"
            priority
          />
        </div>
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1e293b]">
            Vélo du Pélo
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            Réparation de vélos à domicile sur Lyon
          </p>
        </div>
        <div className="w-full flex flex-col gap-3">
          <SignedOut>
            <Link href="/repair" className="w-full" passHref>
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-bold rounded-[2rem] bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-md transition-all active:scale-[0.98] group"
              >
                <span>Réparer mon vélo</span>
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/sign-in" className="w-full" passHref>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-14 text-base font-semibold border-slate-200 bg-white hover:bg-slate-50 text-[#1e293b] rounded-[2rem] shadow-sm transition-all active:scale-[0.98]"
              >
                <LogIn className="mr-2 w-5 h-5 opacity-70" />
                <span>Se connecter</span>
              </Button>
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/interventions" className="w-full" passHref>
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-bold rounded-[2rem] bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-[0.98] group"
              >
                <LayoutDashboard className="mr-2 w-5 h-5" />
                <span>Mes Interventions</span>
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <SignOutButton redirectUrl="/">
              <Button 
                variant="ghost" 
                size="lg" 
                className="w-full h-12 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-[2rem] transition-all"
              >
                <LogOut className="mr-2 w-4 h-4" />
                <span>Déconnexion</span>
              </Button>
            </SignOutButton>
          </SignedIn>
        </div>
        <div className="flex flex-col items-center gap-1 mt-4">
          <div className="h-1 w-12 bg-slate-300 rounded-full mb-2"></div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            Lyon & Métropole
          </p>
        </div>
      </div>
    </main>
  );
}

