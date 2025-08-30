from ..summarizer import _train_small_t5, ensure_model

if __name__ == "__main__":
    _train_small_t5()
    ensure_model()
    print("Training completed and model ensured.")
