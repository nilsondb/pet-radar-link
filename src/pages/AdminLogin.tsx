import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ADMIN_EMAIL = "admin@petid.com";
const ADMIN_SENHA = "123456";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && senha === ADMIN_SENHA) {
      localStorage.setItem("isAdmin", "true");
      navigate("/admin", { replace: true });
    } else {
      toast.error("Email ou senha inválidos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-card rounded-2xl shadow-lg p-6 space-y-4 border"
      >
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-primary">Pet_ID 🐾</h1>
          <p className="text-sm text-muted-foreground">Área administrativa</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <Input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full">Entrar</Button>
      </form>
    </div>
  );
};

export default AdminLogin;
