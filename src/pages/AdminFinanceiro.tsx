import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Loader2 } from "lucide-react";

type Pag = { id: string; descricao: string | null; valor: number; status: string; data_pagamento: string | null; created_at: string; pet_id: string | null };

const AdminFinanceiro = () => {
  const [list, setList] = useState<Pag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("pagamentos").select("*").order("created_at", { ascending: false });
      setList((data as Pag[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <AdminLayout title="Financeiro">
      {loading ? <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /> : (
        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr className="text-left">
              <th className="p-3">Descrição</th><th className="p-3">Pet</th><th className="p-3">Valor</th>
              <th className="p-3">Status</th><th className="p-3">Data</th>
            </tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.descricao || "—"}</td>
                  <td className="p-3 font-mono">{p.pet_id || "—"}</td>
                  <td className="p-3">R$ {Number(p.valor).toFixed(2)}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-muted">{p.status}</span></td>
                  <td className="p-3">{p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString("pt-BR") : "—"}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum pagamento.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminFinanceiro;
