import { ReactNode, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { loadVetSession } from "@/lib/vetAuth";
import { Loader2 } from "lucide-react";

type Estado = "checando" | "autorizado" | "negado";

export const VetGate = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<Estado>("checando");

  const verificar = useCallback(async () => {
    try {
      const session = await loadVetSession();
      setEstado(session ? "autorizado" : "negado");
    } catch {
      setEstado("negado");
    }
  }, []);

  useEffect(() => {
    verificar();

    const { data } = supabase.auth.onAuthStateChange(() => {
      verificar();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [verificar]);

  if (estado === "checando") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (estado === "negado") {
    return <Navigate to="/vet/login" replace />;
  }

  return <>{children}</>;
};
