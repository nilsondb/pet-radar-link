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
  "Receba avisos quando seu pet for encontrado",
];

const beneficiosVet = [
  "Acesse o histórico dos pacientes",
  "Registre atendimentos, exames e vacinas",
  "Acompanhe a saúde de forma integrada",
  "Conecte-se com tutores via Authera Pet",
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
    <span className="opacity-65">Powered by</span>
    <BrainCircuit className="h-5 w-5 text-authera-cyan" />
    <span className="font-bold text-authera-cyan">Jarvis</span>
  </span>
);

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f8f3]">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="hero-gradient relative text-white">
        {/* luzes de fundo */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-authera-blue/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-[18%] h-72 w-72 rounded-full bg-authera-violet/15 blur-3xl"
        />

        {/* HEADER */}
        <header className="relative z-20 mx-auto flex max-w-[1320px] flex-wrap items-center gap-5 px-5 py-6 sm:px-8">
          <Link to="/" className="mr-auto flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <PawPrint className="h-7 w-7 text-white" />
            </span>

            <span className="leading-tight">
              <span className="block text-xl font-extrabold tracking-tight">
                Authera <span className="text-authera-cyan">Pet</span>
              </span>
              <span className="mt-0.5 block text-[11px] text-white/70 sm:text-xs">
                Proteção Inteligente para Pets
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/80 md:flex">
            <a href="#sobre" className="transition hover:text-authera-cyan">
              Sobre
            </a>
            <a
              href="#como-funciona"
              className="transition hover:text-authera-cyan"
            >
              Como funciona
            </a>
            <a href="#ajuda" className="transition hover:text-authera-cyan">
              Ajuda
            </a>
          </nav>

          <Link to="/meus-pets">
            <Button
              variant="outline"
              className="rounded-full border-white/40 bg-transparent px-7 text-white hover:bg-white hover:text-authera-navy"
            >
              Entrar
            </Button>
          </Link>

          <PoweredByJarvis className="hidden xl:inline-flex" />
        </header>

        {/* HERO CONTENT */}
        <div className="relative z-10 mx-auto grid max-w-[1320px] items-center gap-4 px-5 pb-[120px] pt-6 sm:px-8 lg:min-h-[500px] lg:grid-cols-[1.02fr_.98fr] lg:pb-[125px] lg:pt-2">
          {/* TEXTO */}
          <div id="sobre" className="relative z-10 pb-8 lg:pb-16">
            <h1 className="max-w-[650px] text-[2.65rem] font-extrabold leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.55rem]">
              Mais que uma tag.
              <br />
              É{" "}
              <span className="bg-gradient-to-r from-authera-cyan via-sky-400 to-authera-blue bg-clip-text text-transparent">
                segurança, saúde e conexão.
              </span>
            </h1>

            <p className="mt-6 max-w-[590px] text-base leading-7 text-white/80 lg:text-lg">
              A tecnologia Authera Pet ajuda a proteger, identificar e cuidar
              do seu pet em qualquer lugar, com o apoio da inteligência Jarvis.
            </p>

            <ul className="mt-8 grid max-w-[620px] grid-cols-1 gap-4 text-sm sm:grid-cols-3">
              {[
                { icone: ShieldCheck, texto: "Identificação segura" },
                { icone: HeartPulse, texto: "Saúde em dia" },
                { icone: MapPin, texto: "Localização inteligente" },
              ].map(({ icone: Icone, texto }) => (
                <li key={texto} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-authera-cyan/30 bg-authera-cyan/10">
                    <Icone className="h-5 w-5 text-authera-cyan" />
                  </span>
                  <span className="max-w-[8rem] leading-tight text-white/90">
                    {texto}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* PETS */}
          <div className="relative flex min-h-[300px] items-end justify-center lg:min-h-[470px]">
            {/* círculos tecnológicos */}
            <div
              aria-hidden
              className="absolute bottom-[62px] left-1/2 h-[380px] w-[520px] -translate-x-1/2 rounded-[50%] border border-authera-cyan/30"
            />
            <div
              aria-hidden
              className="absolute bottom-[92px] left-1/2 h-[320px] w-[440px] -translate-x-1/2 rounded-[50%] border border-authera-blue/25"
            />
            <div
              aria-hidden
              className="absolute right-[10%] top-[18%] h-2.5 w-2.5 rounded-full bg-authera-cyan shadow-[0_0_24px_rgba(34,211,238,.9)]"
            />
            <div
              aria-hidden
              className="absolute bottom-[26%] right-[2%] h-2 w-2 rounded-full bg-authera-blue shadow-[0_0_20px_rgba(59,130,246,.8)]"
            />

            <img
              src={heroPets}
              alt="Cachorro e gato usando tags NFC do Authera Pet"
              width={1024}
              height={1024}
              className="relative z-10 mb-[52px] w-full max-w-[525px] object-contain drop-shadow-2xl lg:max-w-[570px]"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          CARDS FLUTUANTES
      ====================================================== */}
      <main className="relative z-30 mx-auto -mt-[92px] max-w-[1320px] px-5 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* TUTOR */}
          <section className="group relative min-h-[355px] overflow-hidden rounded-[28px] border border-cyan-100 bg-gradient-to-br from-white via-white to-cyan-50 p-7 shadow-[0_22px_55px_-30px_rgba(8,47,73,.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_-30px_rgba(8,47,73,.45)] sm:p-9">
            {/* decoração */}
            <PawPrint
              aria-hidden
              className="pointer-events-none absolute right-10 top-20 h-36 w-36 rotate-[-8deg] text-authera-cyan opacity-[0.08]"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute bottom-5 right-9 hidden rotate-[-7deg] text-right text-xl italic leading-6 text-authera-cyan/60 sm:block"
            >
              Seu pet
              <br />
              sempre
              <br />
              seguro ♡
            </div>

            <div className="relative z-10 max-w-[72%] sm:max-w-[70%]">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-authera-cyan to-cyan-600 text-white shadow-lg shadow-cyan-500/15">
                  <User className="h-7 w-7" />
                </span>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Área do Tutor
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Gerencie, proteja e acompanhe seu pet.
                  </p>
                </div>
              </div>

              <ul className="mt-7 space-y-3 text-[15px] text-slate-700">
                {beneficiosTutor.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-cyan-50">
                      <Check className="h-3.5 w-3.5 text-cyan-600" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-7 max-w-[72%] space-y-3 sm:max-w-[70%]">
              <Link to="/meus-pets" className="block">
                <Button className="h-11 w-full rounded-full border-0 bg-gradient-to-r from-cyan-500 to-cyan-700 text-white shadow-sm transition hover:opacity-90">
                  Entrar como Tutor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link to="/meus-pets" className="block">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-full border-cyan-500 bg-white/70 text-cyan-700 hover:bg-cyan-50"
                >
                  Criar conta de Tutor
                </Button>
              </Link>
            </div>
          </section>

          {/* VETERINÁRIO */}
          <section className="group relative min-h-[355px] overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50 p-7 shadow-[0_22px_55px_-30px_rgba(76,29,149,.30)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_-30px_rgba(76,29,149,.40)] sm:p-9">
            {/* decoração */}
            <Stethoscope
              aria-hidden
              className="pointer-events-none absolute right-9 top-16 h-40 w-40 rotate-[5deg] text-authera-violet opacity-[0.08]"
            />

            <div
              aria-hidden
              className="pointer-events-none absolute bottom-5 right-8 hidden rotate-[-6deg] text-right text-xl italic leading-6 text-authera-violet/55 sm:block"
            >
              Tecnologia
              <br />
              a favor da vida
              <br />♡
            </div>

            <div className="relative z-10 max-w-[72%] sm:max-w-[70%]">
              <div className="flex items-center gap-4">
                <span className="grid h-14 w-14 flex-none place-items-center rounded-full bg-gradient-to-br from-authera-violet to-indigo-600 text-white shadow-lg shadow-violet-500/15">
                  <Stethoscope className="h-7 w-7" />
                </span>

                <div>
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    Área do Veterinário
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Atenda com mais eficiência e segurança.
                  </p>
                </div>
              </div>

              <ul className="mt-7 space-y-3 text-[15px] text-slate-700">
                {beneficiosVet.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-violet-50">
                      <Check className="h-3.5 w-3.5 text-violet-600" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-7 max-w-[72%] space-y-3 sm:max-w-[70%]">
              <Link to="/vet/login" className="block">
                <Button className="h-11 w-full rounded-full border-0 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm transition hover:opacity-90">
                  Entrar como Veterinário
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link to="/vet/login?modo=cadastro" className="block">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-full border-violet-500 bg-white/70 text-violet-700 hover:bg-violet-50"
                >
                  Criar conta de Veterinário
                </Button>
              </Link>
            </div>
          </section>
        </div>

        {/* =====================================================
            COMO FUNCIONA
        ====================================================== */}
        <section id="como-funciona" className="pb-14 pt-8 sm:pb-16 sm:pt-10">
          <div className="text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Como funciona
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Em poucos passos, seu pet fica mais seguro e conectado.
            </p>
          </div>

          <div className="relative mx-auto mt-9 max-w-[1040px]">
            <div
              aria-hidden
              className="absolute left-[15%] right-[15%] top-5 hidden border-t border-dashed border-slate-200 sm:block"
            />

            <div className="relative grid gap-8 sm:grid-cols-3">
              {passos.map(({ icone: Icone, titulo, texto }, i) => (
                <div
                  key={titulo}
                  className="relative flex items-start justify-center gap-4 sm:px-4"
                >
                  <span
                    className={`relative z-10 grid h-10 w-10 flex-none place-items-center rounded-full text-sm font-bold text-white shadow-sm ${
                      i === 0
                        ? "bg-cyan-500"
                        : i === 1
                          ? "bg-blue-500"
                          : "bg-violet-600"
                    }`}
                  >
                    {i + 1}
                  </span>

                  <div className="pt-0.5">
                    <div className="flex items-center gap-2">
                      <Icone className="h-5 w-5 text-authera-navy" />
                      <h3 className="font-bold text-slate-900">{titulo}</h3>
                    </div>
                    <p className="mt-1 max-w-[220px] text-sm leading-5 text-slate-500">
                      {texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p
            id="ajuda"
            className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500"
          >
            Precisa de ajuda? Aproxime sua tag NFC do celular para abrir a
            identificação do seu pet ou acesse a Área do Tutor.
          </p>
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <PawPrint className="h-7 w-7 text-authera-navy" />
            <div>
              <p className="font-extrabold text-authera-navy">
                Authera <span className="text-authera-cyan">Pet</span>
              </p>
              <p className="text-xs text-slate-500 sm:text-sm">
                Tecnologia e cuidado para um mundo com mais pets seguros.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <PoweredByJarvis />
            <span className="hidden h-5 border-l border-slate-300 sm:block" />
            <span>Protegendo o que importa.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
