"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { clerkAppearance } from "@/lib/auth-config";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/interventions";

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#ebeced]">
      <SignUp 
        appearance={clerkAppearance} 
        forceRedirectUrl={redirectUrl}
        signInForceRedirectUrl={redirectUrl}
      />
    </div>
  );
}
