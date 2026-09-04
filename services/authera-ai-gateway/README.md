# Authera AI Gateway

Gateway privado entre as Edge Functions do Authera Pet e o Ollama do SRV-IA.

## Objetivo

- manter o Supabase responsável por Auth, RLS e dados;
- manter o processamento de IA no SRV-IA/JARVIS;
- não expor o Ollama diretamente à internet;
- aceitar somente chamadas autenticadas pelo token interno do gateway;
- separar análise resumida do histórico e análise educativa de exames.

## Endpoints

- `GET /health` — saúde do gateway e modelos disponíveis no Ollama.
- `POST /v1/pet/summary` — gera resumo longitudinal estruturado.
- `POST /v1/pet/exam` — explica texto, PDF ou imagem de exame.

## Variáveis

Copie `.env.example` para `.env` e nunca versione o `.env` real.

- `OLLAMA_URL` — normalmente `http://host.docker.internal:11434` quando o Ollama roda no host.
- `OLLAMA_MODEL` — modelo de texto, inicialmente `qwen3:4b`.
- `OLLAMA_VISION_MODEL` — modelo multimodal opcional para imagens.
- `GATEWAY_TOKEN` — segredo forte compartilhado apenas com as Edge Functions.
- `REQUEST_TIMEOUT` — timeout de consulta ao Ollama.

## Segurança

O container publica a porta somente em `127.0.0.1:8091`. Não publique a porta 8091 diretamente na internet. Quando formos colocar em produção, o acesso externo deverá passar pelo túnel/proxy seguro da Authera e chegar apenas ao gateway, nunca ao Ollama.

As Edge Functions `ia-resumo-pet` e `ia-exame` usam `AUTHERA_AI_URL` e `AUTHERA_AI_TOKEN`. O valor de `AUTHERA_AI_TOKEN` deve ser igual ao `GATEWAY_TOKEN` do SRV-IA.

## Observações sobre exames

PDFs são decodificados no gateway e o texto é extraído localmente com `pypdf`. Imagens exigem um modelo multimodal configurado em `OLLAMA_VISION_MODEL`; sem ele a API retorna 503 de forma explícita, sem fingir que analisou a imagem.

A IA é educativa: não deve emitir diagnóstico definitivo nem prescrever medicamento.
