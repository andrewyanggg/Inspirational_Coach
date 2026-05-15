from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from dotenv import load_dotenv
import torch
import re
import os

# Load environment variables
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# Define request model
class RequestModel(BaseModel):
    prompt: str
    max_tokens: int = 100

# Load the LLaMA 3.2 1B model
MODEL_NAME = "meta-llama/Llama-3.2-1B-Instruct"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, token=HF_TOKEN)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME, torch_dtype=torch.float16, device_map="auto", token=HF_TOKEN)

# Initialize FastAPI
app = FastAPI()

# Enable CORS (Allow frontend requests)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def clean_generated_text(text: str) -> str:
    """Remove leading/trailing quotes from response."""
    cleaned_text = re.sub(r'^["""]+|["""]+$', '', text)
    cleaned_text = re.sub(r'^[^:]*:', '', cleaned_text)
    cleaned_text = re.sub(r'You are a personal inspirational coach\.', '', cleaned_text)
    if cleaned_text.startswith('"'):
        cleaned_text = cleaned_text[1:].strip()
    return cleaned_text.strip()

@app.post("/generate")
async def generate_text(request: RequestModel):
    inputs = tokenizer(request.prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")
    outputs = model.generate(**inputs, max_new_tokens=request.max_tokens)
    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    generated_response = clean_generated_text(full_response.replace(request.prompt, "").strip())
    return {"response": generated_response}

@app.post("/goal")
async def generate_goal_text(request: RequestModel):
    inputs = tokenizer(request.prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")
    outputs = model.generate(**inputs, max_new_tokens=request.max_tokens)
    full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"response": full_response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
