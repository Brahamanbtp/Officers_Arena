import os
import re
import json
import time
import random
import requests
import base64
from typing import Dict, Any, Optional, List, Tuple
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai

genai_key = os.getenv("GEMINI_API_KEY")
if genai_key:
    try:
        genai.configure(api_key=genai_key)
    except Exception:
        pass

class ProviderState:
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    RATE_LIMITED = "RATE_LIMITED"
    QUOTA_EXHAUSTED = "QUOTA_EXHAUSTED"
    OFFLINE = "OFFLINE"
    AUTH_ERROR = "AUTH_ERROR"

def retry_with_backoff(func, max_retries=3, initial_delay=1.0):
    """Executes a cloud function with exponential backoff and jitter for 429/5xx errors."""
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            res = func()
            if res is not None:
                return res
        except Exception as e:
            err_str = str(e).lower()
            if any(x in err_str for x in ["429", "quota", "resourceexhausted", "500", "502", "503", "timeout"]):
                sleep_time = delay + random.uniform(0.1, 0.5)
                time.sleep(sleep_time)
                delay *= 2.0
            elif any(x in err_str for x in ["401", "403", "invalid api key", "auth"]):
                # Fail-fast on auth errors
                break
            else:
                break
    return None

class MistralCloudProvider:
    """Mistral Pixtral Vision Cloud OCR Provider."""
    @classmethod
    def is_available(cls) -> bool:
        return bool(os.getenv("MISTRAL_API_KEY"))

    @classmethod
    def process_image(cls, img_bytes: bytes, prompt: str) -> Optional[str]:
        key = os.getenv("MISTRAL_API_KEY")
        if not key:
            return None

        def _call():
            b64_img = base64.b64encode(img_bytes).decode("utf-8")
            url = "https://api.mistral.ai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            payload = {
                "model": "pixtral-12b-2409",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_img}"}}
                        ]
                    }
                ],
                "temperature": 0.1
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=45)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
            return None

        return retry_with_backoff(_call)


class GoogleVisionCloudProvider:
    """Google Cloud Vision REST API Provider."""
    @classmethod
    def is_available(cls) -> bool:
        return bool(os.getenv("GOOGLE_CLOUD_VISION_API_KEY"))

    @classmethod
    def process_image(cls, img_bytes: bytes) -> Optional[str]:
        key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
        if not key:
            return None

        def _call():
            b64_img = base64.b64encode(img_bytes).decode("utf-8")
            url = f"https://vision.googleapis.com/v1/images:annotate?key={key}"
            payload = {
                "requests": [
                    {
                        "image": {"content": b64_img},
                        "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]
                    }
                ]
            }
            resp = requests.post(url, json=payload, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data["responses"][0]["fullTextAnnotation"]["text"]
            return None

        return retry_with_backoff(_call)


class GeminiCloudProvider:
    """Gemini Reasoning & KaTeX Vision Provider."""
    MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ]

    @classmethod
    def is_available(cls) -> bool:
        return bool(os.getenv("GEMINI_API_KEY"))

    @classmethod
    def process_image(cls, img_bytes: bytes, prompt: str) -> Optional[Tuple[str, str]]:
        current_key = os.getenv("GEMINI_API_KEY")
        if not current_key:
            return None

        for model_name in cls.MODELS:
            def _call():
                import io
                from PIL import Image
                genai.configure(api_key=current_key)
                m = genai.GenerativeModel(model_name)
                img = Image.open(io.BytesIO(img_bytes))
                res = m.generate_content(
                    [prompt, img],
                    generation_config={"temperature": 0.1}
                )
                if res and res.text:
                    return (res.text.strip(), model_name)
                return None

            result = retry_with_backoff(_call, max_retries=2)
            if result:
                return result
        return None


class GroqVerificationProvider:
    """Groq Selective 2nd-Opinion Verifier."""
    @classmethod
    def is_available(cls) -> bool:
        return bool(os.getenv("GROQ_API_KEY"))

    @classmethod
    def verify_question(cls, question_text: str, options: Dict[str, Any], proposed_answer: str) -> Optional[bool]:
        key = os.getenv("GROQ_API_KEY")
        if not key:
            return None

        def _call():
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            prompt = f"""
            Verify if the proposed answer '{proposed_answer}' is correct for this exam question:
            Question: {question_text}
            Options: {json.dumps(options)}

            Reply with ONLY JSON: {{"agree": true}} or {{"agree": false}}
            """
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0
            }
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                txt = resp.json()["choices"][0]["message"]["content"]
                return "true" in txt.lower()
            return None

        return retry_with_backoff(_call, max_retries=2)
