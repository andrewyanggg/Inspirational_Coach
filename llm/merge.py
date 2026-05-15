import torch
import os
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
HF_TOKEN = os.getenv("HF_TOKEN")

# Paths
BASE_MODEL_PATH = "meta-llama/Llama-3.2-1B-Instruct"
FINETUNED_ADAPTER_PATH = "./weights"
MERGED_MODEL_PATH = "./llama-finetuned"

# Load base model
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_PATH,
    token=HF_TOKEN,
    torch_dtype=torch.float16,
    device_map="auto"
)

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_PATH, token=HF_TOKEN)

# Merge LoRA adapter with base model
model = PeftModel.from_pretrained(base_model, FINETUNED_ADAPTER_PATH)
model = model.merge_and_unload()

# Save the merged model & tokenizer
model.save_pretrained(MERGED_MODEL_PATH)
tokenizer.save_pretrained(MERGED_MODEL_PATH)

print("✅ Merged model saved to:", MERGED_MODEL_PATH)
