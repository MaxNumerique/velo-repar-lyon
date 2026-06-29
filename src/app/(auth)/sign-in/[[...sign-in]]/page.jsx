"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { clerkAppearance } from "@/lib/authConfig";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/interventions";

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#ebeced]">
      <SignIn 
        appearance={clerkAppearance} 
        forceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
