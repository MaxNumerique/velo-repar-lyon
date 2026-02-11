import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/auth-config";

export default function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[#ebeced]">
      <SignUp appearance={clerkAppearance} />
    </div>
  );
}
