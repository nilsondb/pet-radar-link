import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  PawPrint,
  ShieldCheck,
  HeartPulse,
  MapPin,
  Check,
  User,
  Stethoscope,
  Nfc,
  BrainCircuit,
  ArrowRight,
} from "lucide-react";
import heroPets from "@/assets/hero-pets.png";

const beneficiosTutor = [
  "Ative sua tag NFC",
  "Cadastre e gerencie seus pets",
  "Acesse informações de saúde e vacinas",
  "Acompanhe localização e histórico",
  "Receba informações quando seu pet for encontrado",
];

const beneficiosVet = [
  "Acesse seus pacientes autorizados",
  "Consulte histórico de saúde",
  "Registre atendimentos",
  "Acompanhe exames e vacinação",
  "Conecte-se aos tutores através do Authera Pet",
];

const passos = [
  {
    icone: Nfc,
    titulo: "Ative a tag",
    texto: "Aproxime seu celular e ative sua tag NFC.",
  },
  {
    icone: PawPrint,
    titulo: "Cadastre seu pet",
    texto: "Adicione nome, foto e informações importantes.",
  },
  {
    icone: HeartPulse,
    titulo: "Sempre protegido",
    texto: "Quem encontrar seu pet consegue avisar você.",
  },
];

const PoweredByJarvis = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-2 text-sm ${className}`}>
    <span className="opacity-70">Powered by</span>
    <BrainCircuit className="w-4 h-4 text-authera-cyan" />
    <span className="font-semibold">Jarvis</span>
  </span>
);

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* HERO + HEADER */}
      <section className="hero-gradient relative text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 right-0 h-[28rem] w-[28rem] rounded-full bg-authera-cyan/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-authera-violet/20 blur-3xl"
        />

        <header className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center gap-4">
          <Link to="/" className="flex items-center gap-3 mr-auto">
            <span className="grid place-items-center w-11 h-11 rounded-2xl bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
              <PawPrint className="w-6 h-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold">
                Authera <span className="text-authera-cyan">Pet</span>
              </span>
              <span className="block text-[11px] sm:text-xs opacity-75">
                Proteção Inteligente para Pets
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm opacity-90">
            <a href="#sobre" className="hover:opacity-100 hover:text-authera-cyan transition-colors">Sobre</a>
            <a href="#como-funciona" className="hover:opacity-100 hover:text-authera-cyan transition-colors">Como funciona</a>
            <a href="#ajuda" className="hover:opacity-100 hover:text-authera-cyan transition-colors">Ajuda</a>
          </nav>

          <Link to="/meus-pets">
            <Button
              variant="outline"
              className="rounded-full bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground hover:text-authera-navy"
            >
              Entrar
            </Button>
          </Link>

          <PoweredByJarvis className="hidden lg:inline-flex" />
        </header>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-32 grid lg:grid-cols-2 gap-10 items-center">
          <div id="sobre">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Mais que uma tag.
              <br />
              É{" "}
              <span className="bg-gradient-to-r from-authera-cyan to-authera-blue bg-clip-text text-transparent">
                segurança, saúde e conexão.
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg opacity-85 max-w-xl">
              A tecnologia Authera Pet ajuda a proteger, identificar e cuidar do seu pet em
              qualquer lugar, com o apoio da inteligência Jarvis.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              {[
                { icone: ShieldCheck, texto: "Identificação segura" },
                { icone: HeartPulse, texto: "Saúde em dia" },
                { icone: MapPin, texto: "Localização inteligente" },
              ].map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-center gap-2">
                  <Icone className="w-5 h-5 text-authera-cyan" />
                  <span className="opacity-90 max-w-[7.5rem]">{texto}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-h-[16rem] flex items-end justify-center">
            <div
              aria-hidden
              className="absolute inset-x-6 bottom-0 top-6 rounded-full border border-authera-cyan/30"
            />
            <img
              src={heroPets}
              alt="Cachorro e gato usando tags NFC do Authera Pet"
              width={1024}
              height={1024}
              className="relative w-full max-w-md object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ÁREAS DE ACESSO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* TUTOR */}
          <section className="pet-card border border-authera-cyan/20 bg-gradient-to-br from-card to-authera-cyan/5">
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-2xl btn-cyan shadow-sm">
                <User className="w-7 h-7" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Área do Tutor</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie, proteja e acompanhe seu pet.
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {beneficiosTutor.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-authera-cyan flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 space-y-3">
              <Link to="/meus-pets" className="block">
                <Button className="w-full rounded-full btn-cyan hover:opacity-90">
                  Entrar como Tutor <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/meus-pets" className="block">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-authera-cyan/50 text-authera-cyan hover:bg-authera-cyan/10"
                >
                  Criar conta de Tutor
                </Button>
              </Link>
            </div>
          </section>

          {/* VETERINÁRIO */}
          <section className="pet-card border border-authera-violet/20 bg-gradient-to-br from-card to-authera-violet/5">
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-2xl btn-violet shadow-sm">
                <Stethoscope className="w-7 h-7" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Área do Veterinário</h2>
                <p className="text-sm text-muted-foreground">
                  Atenda com mais eficiência e segurança.
                </p>
              </div>
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              {beneficiosVet.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="w-4 h-4 mt-0.5 text-authera-violet flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 space-y-3">
              <Link to="/vet/login" className="block">
                <Button className="w-full rounded-full btn-violet hover:opacity-90">
                  Entrar como Veterinário <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/vet/login?modo=cadastro" className="block">
                <Button
                  variant="outline"
                  className="w-full rounded-full border-authera-violet/50 text-authera-violet hover:bg-authera-violet/10"
                >
                  Criar conta de Veterinário
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Como funciona</h2>
          <p className="mt-2 text-center text-muted-foreground text-sm sm:text-base">
            Em poucos passos, seu pet fica mais seguro e conectado.
          </p>

          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {passos.map(({ icone: Icone, titulo, texto }, i) => (
              <div key={titulo} className="pet-card flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="grid place-items-center w-8 h-8 rounded-full btn-cyan text-xs font-bold">
                    {i + 1}
                  </span>
                  <Icone className="w-6 h-6 text-authera-violet" />
                </div>
                <div>
                  <h3 className="font-semibold">{titulo}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
                </div>
              </div>
            ))}
          </div>

          <p id="ajuda" className="mt-10 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            Precisa de ajuda? Toque a sua tag NFC com o celular para abrir a página do seu pet, ou
            entre na Área do Tutor para concluir a ativação.
          </p>
        </section>
      </main>

      {/* RODAPÉ */}
      <footer className="hero-gradient text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <PawPrint className="w-6 h-6 text-authera-cyan" />
            <div>
              <p className="font-bold">Authera Pet</p>
              <p className="text-sm opacity-75">
                Tecnologia e cuidado para um mundo com mais pets seguros.
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <PoweredByJarvis />
            <p className="text-sm opacity-75">Protegendo o que importa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
