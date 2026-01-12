"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Loading } from "./Loading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!session) {
        router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname));
      } else {
        setStatus("ready");
      }
    };

    void check();
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading label="Validando sessão" />
      </div>
    );
  }

  return <>{children}</>;
}
