import base64
import io
import json
import os
import secrets
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from pypdf import PdfReader

APP_NAME = "Authera AI Gateway"
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://host.docker.internal:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "").strip()
GATEWAY_TOKEN = os.getenv("GATEWAY_TOKEN", "")
REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "120"))

app = FastAPI(title=APP_NAME, version="1.0.0")


class SummaryRequest(BaseModel):
    pet_id: str
    user_id: str
    contexto: dict[str, Any]


class ExamFile(BaseModel):
    nome: str | None = None
    mime: str
    base64: str


class ExamRequest(BaseModel):
    pet_id: str
    user_id: str
    pergunta: str | None = Field(default=None, max_length=8000)
    arquivo: ExamFile | None = None
    contexto: dict[str, Any]


def authorize(authorization: str | None) -> None:
    if not GATEWAY_TOKEN:
        raise HTTPException(status_code=503, detail="GATEWAY_TOKEN não configurado")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Não autorizado")
    supplied = authorization[7:].strip()
    if not secrets.compare_digest(supplied, GATEWAY_TOKEN):
        raise HTTPException(status_code=401, detail="Não autorizado")


async def ollama_chat(model: str, messages: list[dict[str, Any]], *, json_mode: bool = False) -> str:
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {"temperature": 0.2},
    }
    if json_mode:
        payload["format"] = "json"

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        response = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Ollama indisponível ({response.status_code})")
    data = response.json()
    content = data.get("message", {}).get("content")
    if not isinstance(content, str) or not content.strip():
        raise HTTPException(status_code=502, detail="Resposta vazia do modelo")
    return content.strip()


def pdf_to_text(encoded: str) -> str:
    try:
        raw = base64.b64decode(encoded, validate=True)
        reader = PdfReader(io.BytesIO(raw))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        return text.strip()[:30000]
    except Exception as exc:
        raise HTTPException(status_code=400, detail="PDF inválido ou sem texto legível") from exc


SUMMARY_SYSTEM = """Você é o motor informativo da Authera Pet, especializado em acompanhamento longitudinal de animais de companhia.
Use apenas os dados fornecidos. Não invente fatos, diagnósticos, exames, doses ou tratamentos.
Não faça diagnóstico definitivo e não prescreva medicamentos.
Se houver sinal de urgência, recomende avaliação médico-veterinária imediata.
Responda SOMENTE em JSON válido com as chaves: resumo, score_saude, alertas, recomendacoes.
score_saude deve ser exatamente verde, amarelo ou vermelho.
O resumo deve ser claro, curto e educativo em português do Brasil.
"""


EXAM_SYSTEM = """Você é o assistente educativo da Authera Pet para interpretação de exames e dúvidas sobre saúde animal.
Explique em português do Brasil e use somente o contexto e o material fornecidos.
Não dê diagnóstico definitivo, não prescreva medicamentos e não substitua avaliação médico-veterinária.
Diferencie achados objetivos de possibilidades. Quando faltarem dados, diga claramente o que falta.
Estruture a resposta em: Explicação simples; Pontos que merecem atenção; Quando procurar o veterinário; Próximos passos seguros.
Finalize lembrando que a análise é educativa e não substitui consulta veterinária.
"""


@app.get("/health")
async def health() -> dict[str, Any]:
    ok = False
    models: list[str] = []
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
        if response.is_success:
            ok = True
            models = [m.get("name", "") for m in response.json().get("models", []) if m.get("name")]
    except Exception:
        pass
    return {
        "service": APP_NAME,
        "status": "ok" if ok else "degraded",
        "ollama": ok,
        "model": OLLAMA_MODEL,
        "vision_model": OLLAMA_VISION_MODEL or None,
        "available_models": models,
    }


@app.post("/v1/pet/summary")
async def pet_summary(payload: SummaryRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    authorize(authorization)
    prompt = (
        "Analise o histórico a seguir e devolva o JSON solicitado.\n\n"
        + json.dumps(payload.contexto, ensure_ascii=False, default=str)
    )
    raw = await ollama_chat(
        OLLAMA_MODEL,
        [
            {"role": "system", "content": SUMMARY_SYSTEM},
            {"role": "user", "content": prompt},
        ],
        json_mode=True,
    )
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="Modelo retornou JSON inválido") from exc

    score = data.get("score_saude")
    if score not in {"verde", "amarelo", "vermelho"}:
        score = "amarelo"
    return {
        "resumo": str(data.get("resumo") or "Não foi possível gerar um resumo conclusivo."),
        "score_saude": score,
        "alertas": [str(x) for x in (data.get("alertas") or [])][:20],
        "recomendacoes": [str(x) for x in (data.get("recomendacoes") or [])][:20],
    }


@app.post("/v1/pet/exam")
async def pet_exam(payload: ExamRequest, authorization: str | None = Header(default=None)) -> dict[str, str]:
    authorize(authorization)

    pergunta = (payload.pergunta or "").strip()
    parts = [
        f"Contexto do pet:\n{json.dumps(payload.contexto, ensure_ascii=False, default=str)}",
    ]
    if pergunta:
        parts.append(f"Pergunta do tutor:\n{pergunta}")

    messages: list[dict[str, Any]] = [{"role": "system", "content": EXAM_SYSTEM}]
    model = OLLAMA_MODEL

    if payload.arquivo:
        mime = payload.arquivo.mime.lower()
        if mime == "application/pdf":
            text = pdf_to_text(payload.arquivo.base64)
            if not text:
                raise HTTPException(status_code=400, detail="Não foi possível extrair texto do PDF")
            parts.append(f"Texto extraído do exame PDF:\n{text}")
        elif mime in {"image/png", "image/jpeg", "image/jpg", "image/webp"}:
            if not OLLAMA_VISION_MODEL:
                raise HTTPException(status_code=503, detail="Modelo de visão ainda não configurado")
            model = OLLAMA_VISION_MODEL
            messages.append({
                "role": "user",
                "content": "\n\n".join(parts + ["Analise também a imagem anexada."]),
                "images": [payload.arquivo.base64],
            })
        else:
            raise HTTPException(status_code=400, detail="Formato de arquivo não suportado")

    if len(messages) == 1:
        messages.append({"role": "user", "content": "\n\n".join(parts)})

    resposta = await ollama_chat(model, messages)
    return {"resposta": resposta}
