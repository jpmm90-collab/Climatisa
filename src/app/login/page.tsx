import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image
            src="/branding/climatisa-logo.png"
            alt="Climatisa"
            width={72}
            height={72}
            className="rounded-xl"
            priority
          />
          <h1 className="text-xl font-semibold">Climatisa</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingresa tu usuario y contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
