import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  HeartPulse,
  MapPin,
  Nfc,
  PawPrint,
  ShieldCheck,
  Stethoscope,
  User,
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
  { icone: Nfc, titulo: "Ative a tag", texto: "Aproxime seu celular e ative sua tag NFC." },
  { icone: PawPrint, titulo: "Cadastre seu pet", texto: "Adicione nome, foto e informações importantes." },
  { icone: HeartPulse, titulo: "Sempre protegido", texto: "Quem encontrar seu pet consegue avisar você." },
];

const PoweredByJarvis = ({ className = "" }: { className?: string }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <span className="text-xs font-medium text-primary-foreground/55">Powered by</span>
    <span className="grid h-7 w-7 place-items-center rounded-full border border-authera-cyan/25 bg-authera-cyan/10">
      <BrainCircuit className="h-3.5 w-3.5 text-authera-cyan" />
    </span>
    <span className="text-sm font-bold text-primary-foreground">Jarvis</span>
  </span>
);

const AccessCard = ({ type }: { type: "tutor" | "vet" }) => {
  const tutor = type === "tutor";
  const benefits = tutor ? beneficiosTutor : beneficiosVet;
  const Icon = tutor ? User : Stethoscope;

  return (
    <section className={`access-card group relative overflow-hidden ${tutor ? "access-card-tutor" : "access-card-vet"}`}>
      <Icon
        aria-hidden
        strokeWidth={1.2}
        className={`pointer-events-none absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 ${tutor ? "text-authera-cyan/5" : "text-authera-violet/5"}`}
      />

      <div className="relative flex items-center gap-5">
        <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full ${tutor ? "btn-cyan" : "btn-violet"}`}>
          <Icon className="h-8 w-8 text-primary-foreground" />
        </span>
        <div>
          <h2 className="font-heading text-2xl font-bold sm:text-[1.75rem]">
            {tutor ? "Área do Tutor" : "Área do Veterinário"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {tutor ? "Gerencie, proteja e acompanhe seu pet." : "Atenda com mais eficiência e segurança."}
          </p>
        </div>
      </div>

      <ul className="relative mt-8 space-y-4 text-sm sm:text-[0.95rem]">
        {benefits.map((item) => (
          <li key={item} className="flex items-start gap-3.5">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${tutor ? "bg-authera-cyan/10" : "bg-authera-violet/10"}`}>
              <Check className={`h-3.5 w-3.5 ${tutor ? "text-authera-cyan" : "text-authera-violet"}`} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto space-y-3.5 pt-8">
        <Link to={tutor ? "/meus-pets" : "/vet/login"} className="block">
          <Button className={`h-12 w-full rounded-full text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:opacity-95 ${tutor ? "btn-cyan" : "btn-violet"}`}>
            {tutor ? "Entrar como Tutor" : "Entrar como Veterinário"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link to={tutor ? "/meus-pets" : "/vet/login?modo=cadastro"} className="block">
          <Button
            variant="outline"
            className={`h-12 w-full rounded-full bg-card/60 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${tutor ? "border-authera-cyan/55 text-authera-cyan hover:bg-authera-cyan/5" : "border-authera-violet/50 text-authera-violet hover:bg-authera-violet/5"}`}
          >
            {tutor ? "Criar conta de Tutor" : "Criar conta de Veterinário"}
          </Button>
        </Link>
      </div>
    </section>
  );
};

const Index = () => (
  <div className="min-h-screen overflow-x-hidden bg-background font-body">
    <section className="hero-gradient relative min-h-[660px] overflow-hidden text-primary-foreground">
      <div aria-hidden className="hero-light hero-light-one" />
      <div aria-hidden className="hero-light hero-light-two" />

      <header className="relative z-20 mx-auto flex max-w-[1320px] items-center gap-5 px-5 py-6 sm:px-8 lg:px-10">
        <Link to="/" className="mr-auto flex items-center gap-3.5" aria-label="Authera Pet — início">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 shadow-lg">
            <PawPrint className="h-6 w-6 text-authera-cyan" />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-xl font-extrabold">
              Authera <span className="text-authera-cyan">Pet</span>
            </span>
            <span className="mt-0.5 block text-[11px] font-medium text-primary-foreground/60 sm:text-xs">
              Proteção Inteligente para Pets
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-primary-foreground/70 md:flex" aria-label="Navegação principal">
          <a href="#sobre" className="transition-colors hover:text-authera-cyan">Sobre</a>
          <a href="#como-funciona" className="transition-colors hover:text-authera-cyan">Como funciona</a>
          <a href="#ajuda" className="transition-colors hover:text-authera-cyan">Ajuda</a>
        </nav>

        <Link to="/meus-pets">
          <Button variant="outline" className="h-10 rounded-full border-primary-foreground/35 bg-transparent px-6 text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary-foreground hover:text-authera-navy">
            Entrar
          </Button>
        </Link>
        <PoweredByJarvis className="hidden xl:inline-flex" />
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1320px] items-center gap-6 px-5 pb-20 pt-7 sm:px-8 lg:min-h-[550px] lg:grid-cols-[0.94fr_1.06fr] lg:px-10 lg:pb-16 lg:pt-0">
        <div id="sobre" className="relative z-10 max-w-2xl pb-5 lg:pb-20">
          <h1 className="font-heading text-[2.6rem] font-extrabold leading-[1.07] sm:text-5xl lg:text-[3.65rem]">
            Mais que uma tag.
            <br />
            É <span className="hero-title-gradient">segurança, saúde e conexão.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-primary-foreground/72 sm:text-lg sm:leading-8">
            A tecnologia Authera Pet ajuda a proteger, identificar e cuidar do seu pet em qualquer lugar, com o apoio da inteligência Jarvis.
          </p>

          <ul className="mt-9 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
            {[
              { icone: ShieldCheck, texto: "Identificação segura" },
              { icone: HeartPulse, texto: "Saúde em dia" },
              { icone: MapPin, texto: "Localização inteligente" },
            ].map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm font-semibold text-primary-foreground/85">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-authera-cyan/25 bg-authera-cyan/10">
                  <Icone className="h-5 w-5 text-authera-cyan" />
                </span>
                <span>{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex min-h-[330px] items-end justify-center self-end lg:min-h-[530px]">
          <div aria-hidden className="absolute bottom-7 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-authera-cyan/30 lg:h-[490px] lg:w-[490px]" />
          <div aria-hidden className="absolute bottom-2 left-1/2 h-[350px] w-[560px] -translate-x-1/2 rounded-[50%] border border-authera-blue/25" />
          <div aria-hidden className="absolute bottom-24 right-[8%] h-3 w-3 rounded-full bg-authera-cyan shadow-tech-dot" />
          <div aria-hidden className="absolute left-[8%] top-[28%] h-2 w-2 rounded-full bg-authera-blue shadow-tech-dot" />
          <img
            src={heroPets}
            alt="Cachorro e gato usando tags NFC do Authera Pet"
            width={1024}
            height={1024}
            className="hero-pets relative z-10 w-full max-w-[540px] object-contain lg:max-w-[630px]"
          />
        </div>
      </div>
    </section>

    <main className="relative bg-background">
      <div className="relative z-20 mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-10">
        <div className="grid gap-6 pt-8 lg:-mt-24 lg:grid-cols-2 lg:pt-0">
          <AccessCard type="tutor" />
          <AccessCard type="vet" />
        </div>

        <section id="como-funciona" className="py-20 sm:py-24 lg:py-28">
          <div className="text-center">
            <span className="font-heading text-xs font-bold uppercase text-authera-blue">Tecnologia simples, proteção real</span>
            <h2 className="mt-3 font-heading text-3xl font-extrabold sm:text-4xl">Como funciona</h2>
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">Em poucos passos, seu pet fica mais seguro e conectado.</p>
          </div>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-12">
            <div aria-hidden className="absolute left-[16.7%] right-[16.7%] top-8 hidden h-px bg-step-line md:block" />
            {passos.map(({ icone: Icone, titulo, texto }, i) => (
              <article key={titulo} className="relative flex gap-5 md:flex-col md:items-center md:px-6 md:text-center">
                <div className="relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 border-background bg-card shadow-step">
                  <span className="absolute -right-1 -top-2 grid h-6 w-6 place-items-center rounded-full bg-authera-cyan text-xs font-extrabold text-primary-foreground">{i + 1}</span>
                  <Icone className="h-7 w-7 text-authera-violet" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold">{titulo}</h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{texto}</p>
                </div>
              </article>
            ))}
          </div>

          <p id="ajuda" className="mx-auto mt-14 max-w-2xl text-center text-sm leading-6 text-muted-foreground">
            Precisa de ajuda? Toque a sua tag NFC com o celular para abrir a página do seu pet, ou entre na Área do Tutor para concluir a ativação.
          </p>
        </section>
      </div>
    </main>

    <footer className="hero-gradient text-primary-foreground">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-7 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <div className="flex items-center gap-3.5">
          <PawPrint className="h-7 w-7 text-authera-cyan" />
          <div>
            <p className="font-heading font-bold">Authera Pet</p>
            <p className="mt-1 text-sm text-primary-foreground/60">Tecnologia e cuidado para um mundo com mais pets seguros.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:justify-end">
          <PoweredByJarvis />
          <span className="hidden h-5 w-px bg-primary-foreground/20 sm:block" />
          <p className="text-sm text-primary-foreground/60">Protegendo o que importa.</p>
        </div>
      </div>
    </footer>
  </div>
);

export default Index;