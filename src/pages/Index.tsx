import { Button } from "@/components/ui/button";
import { PawPrint, Nfc, Heart, ShieldCheck } from "lucide-react";

const Index = () => {
  const scrollToHowItWorks = () => {
    document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <header className="header-gradient text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <PawPrint className="w-20 h-20 mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Authera Pet</h1>
          <p className="mt-4 text-xl opacity-95 max-w-xl mx-auto">
            Proteção inteligente para pets com tecnologia NFC
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollToHowItWorks(); }}>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto"
              >
                Como funciona
              </Button>
            </a>
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 w-full sm:w-auto"
              onClick={() => {
                const id = prompt("Cole o link da sua tag NFC ou digite seu ID:");
                if (id) {
                  // Accept full URL or raw id
                  try {
                    const url = new URL(id);
                    window.location.href = url.pathname + url.search;
                  } catch {
                    window.location.href = `/setup?id=${encodeURIComponent(id)}`;
                  }
                }
              }}
            >
              Ativar minha tag
            </Button>
          </div>
        </div>
      </header>

      <main id="como-funciona" className="max-w-3xl mx-auto p-4 -mt-8 space-y-4">
        <div className="pet-card text-center">
          <h2 className="text-2xl font-bold mb-2">Como funciona</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Sua tag NFC carrega um link único e seguro para identificar seu pet.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div>
              <Nfc className="w-10 h-10 mx-auto text-primary mb-3" />
              <strong className="block mb-1">1. Encoste a tag</strong>
              <p className="text-muted-foreground">Abre o link com seu ID único</p>
            </div>
            <div>
              <PawPrint className="w-10 h-10 mx-auto text-primary mb-3" />
              <strong className="block mb-1">2. Cadastre seu pet</strong>
              <p className="text-muted-foreground">Foto, nome e contato</p>
            </div>
            <div>
              <Heart className="w-10 h-10 mx-auto text-primary mb-3" />
              <strong className="block mb-1">3. Sempre protegido</strong>
              <p className="text-muted-foreground">Quem encontrar avisa você</p>
            </div>
          </div>
        </div>

        <div className="pet-card flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold mb-1">Ativação segura</h3>
            <p className="text-sm text-muted-foreground">
              Cada tag possui um token de ativação único. Apenas o link fornecido com a sua tag
              permite cadastrar e gerenciar seu pet.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground py-6">
          Authera Pet 🐾 — Proteção inteligente via NFC
        </p>
      </main>
    </div>
  );
};

export default Index;
