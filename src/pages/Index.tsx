import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PawPrint, Nfc, Heart } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      <header className="header-gradient text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <PawPrint className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold">Pet_ID</h1>
          <p className="mt-3 text-lg opacity-90">
            Identificação inteligente para seu pet via NFC.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 -mt-8 space-y-4">
        <div className="pet-card text-center">
          <h2 className="text-xl font-bold mb-2">Como funciona</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Acesse a URL gravada na sua tag NFC com o ID do seu pet.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <Nfc className="w-8 h-8 mx-auto text-primary mb-2" />
              <strong>1. Encoste a tag</strong>
              <p className="text-muted-foreground">Abre o link com seu ID único</p>
            </div>
            <div>
              <PawPrint className="w-8 h-8 mx-auto text-primary mb-2" />
              <strong>2. Cadastre seu pet</strong>
              <p className="text-muted-foreground">Foto, nome e contato</p>
            </div>
            <div>
              <Heart className="w-8 h-8 mx-auto text-primary mb-2" />
              <strong>3. Sempre protegido</strong>
              <p className="text-muted-foreground">Quem encontrar avisa você</p>
            </div>
          </div>
        </div>

        <div className="pet-card text-center">
          <p className="text-sm text-muted-foreground mb-3">Quer testar?</p>
          <Link to="/setup?id=demo-pet-001">
            <Button size="lg">Abrir cadastro de demonstração</Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Index;
