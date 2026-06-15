# download_model.py  — run this ONCE before starting Flask
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="facebook/nllb-200-distilled-600M",
    local_dir="./models/nllb-600M",
    ignore_patterns=["*.msgpack", "*.h5", "flax_model*"]  # skip non-PyTorch files
)
print("Done.")