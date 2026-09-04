import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronDown, PawPrint, Dog } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchMeusPets, fetchPetResumo, petQuery, type PetResumo } from "@/lib/tutorUtils";
import { cn } from "@/lib/utils";

interface Props {
  petId: string;
  token?: string | null;
  className?: string;
}

/** Seletor rápido: mostra o pet atual e permite trocar para outro pet do mesmo tutor. */
export const PetSwitcher = ({ petId, token, className }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [atual, setAtual] = useState<PetResumo | null>(null);
  const [pets, setPets] = useState<PetResumo[]>([]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const pet = await fetchPetResumo(petId);
      if (cancelado) return;
      setAtual(pet);
      if (!pet) return;
      const lista = await fetchMeusPets();
      if (!cancelado) {
        const visiveis = lista.filter((p) => p.status_ativado || p.id === petId);
        setPets(visiveis.length ? visiveis : [pet]);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [petId]);

  const trocar = (p: PetResumo) => {
    navigate(`${location.pathname}${petQuery(p.id)}`);
  };

  if (!atual) return null;

  const outros = pets.filter((p) => p.id !== petId);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-full bg-card border px-3 py-2 text-sm font-semibold shadow-sm hover:bg-accent/40 transition-colors"
          aria-label="Trocar de pet"
        >
          {atual.foto_url ? (
            <img src={atual.foto_url} alt={atual.nome_pet || "Pet"} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-muted-foreground" />
            </span>
          )}
          <span className="max-w-[10rem] truncate">{atual.nome_pet || "Meu pet"}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-popover">
          {outros.length === 0 && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              Nenhum outro pet cadastrado
            </DropdownMenuItem>
          )}
          {outros.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => trocar(p)} className="gap-2 cursor-pointer">
              {p.foto_url ? (
                <img src={p.foto_url} alt={p.nome_pet || "Pet"} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <PawPrint className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="truncate">{p.nome_pet || p.id}</span>
              <span className={cn("ml-auto text-xs", p.status_perdido ? "text-destructive" : "text-success")}>
                {p.status_perdido ? "🔴" : "🟢"}
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate("/meus-pets")}
            className="gap-2 cursor-pointer"
          >
            <Dog className="w-4 h-4" /> Meus Pets
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
