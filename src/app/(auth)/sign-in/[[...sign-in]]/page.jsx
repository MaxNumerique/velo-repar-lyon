import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/auth-config";

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#ebeced]">
      <SignIn appearance={clerkAppearance} />
    </div>
  );
}
