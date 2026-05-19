from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import re

MODEL_PATH = "./llama-finetuned"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    torch_dtype=torch.float16,
    device_map="auto"
)

device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"

class RequestModel(BaseModel):
    prompt: str
    max_tokens: int = 100

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_response(prompt: str, max_tokens: int) -> str:
    """Generate a response with proper parameters and clean output."""
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    prompt_length = inputs.input_ids.shape[1]

    outputs = model.generate(
        **inputs,
        max_new_tokens=max_tokens,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.3,
        pad_token_id=tokenizer.eos_token_id
    )

    new_tokens = outputs[0][prompt_length:]
    response = tokenizer.decode(new_tokens, skip_special_tokens=True)
    return response.strip()

@app.post("/generate")
async def generate_text(request: RequestModel):
    print(f"Received prompt: {request.prompt[:100]}...")
    response = generate_response(request.prompt, request.max_tokens)
    return {"response": response}

@app.post("/goal")
async def generate_goal_text(request: RequestModel):
    print(f"Received goal prompt: {request.prompt[:100]}...")
    response = generate_response(request.prompt, request.max_tokens)
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)