/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ONNX_MODEL_PATH: string;
  readonly VITE_ROBOFLOW_API_KEY: string;
  readonly VITE_ROBOFLOW_MODEL_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

