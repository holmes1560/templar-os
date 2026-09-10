export type AiProvider =
  | "gemini"
  | "anthropic"
  | "openai"
  | "deepseek"
  | "xai"
  | "groq"
  | "mistral"
  | "openrouter"
  | "ollama"
  | "custom";

export interface AiModelInfo {
  id: string;
  name: string;
  description?: string;
  contextWindow?: number;
  isRecommended?: boolean;
}

export interface ProviderDefinition {
  id: AiProvider;
  name: string;
  tagline: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  envKey: string;
  curatedModels: AiModelInfo[];
}

export const PROVIDERS_CATALOG: Record<AiProvider, ProviderDefinition> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    tagline: "Multimodal speed & 1M+ token context",
    defaultModel: "gemini-3.6-flash",
    envKey: "GEMINI_API_KEY",
    curatedModels: [
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        description: "Official fast production model with low latency and quick turnaround.",
        isRecommended: true,
      },
      {
        id: "gemini-3.8-flash",
        name: "Gemini 3.8 Flash",
        description: "Latest Flash generation with deep reasoning (may take longer to respond).",
      },
      {
        id: "gemini-3.7-flash",
        name: "Gemini 3.7 Flash",
        description: "Advanced reasoning and technical code analysis.",
      },
      {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro Preview",
        description: "Deep reasoning model for complex architectural patterns.",
      },
      {
        id: "gemini-flash-latest",
        name: "Gemini Flash (Latest)",
        description: "Auto-updating alias to Google's latest stable Flash model.",
      },
      {
        id: "gemini-pro-latest",
        name: "Gemini Pro (Latest)",
        description: "Auto-updating alias to Google's latest stable Pro model.",
      },
    ],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    tagline: "Extended thinking & technical precision",
    defaultModel: "claude-3-7-sonnet-latest",
    envKey: "ANTHROPIC_API_KEY",
    curatedModels: [
      {
        id: "claude-3-7-sonnet-latest",
        name: "Claude 3.7 Sonnet",
        description: "Hybrid reasoning with adaptive thinking for deep analysis.",
        isRecommended: true,
      },
      {
        id: "claude-3-5-haiku-latest",
        name: "Claude 3.5 Haiku",
        description: "Fastest Claude model for rapid metadata extraction.",
      },
      {
        id: "claude-3-5-sonnet-latest",
        name: "Claude 3.5 Sonnet",
        description: "High-accuracy code and architecture comprehension.",
      },
      {
        id: "claude-3-opus-latest",
        name: "Claude 3 Opus",
        description: "Top-tier reasoning for large multi-package repositories.",
      },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    tagline: "Frontier GPT-4o & reasoning models",
    defaultModel: "gpt-4o",
    defaultBaseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    curatedModels: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Flagship high-intelligence multimodal model for general tasks.",
        isRecommended: true,
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast, cost-effective small model for lightweight extraction.",
      },
      {
        id: "o3-mini",
        name: "o3-mini",
        description: "High-efficiency STEM and reasoning model with thinking capabilities.",
      },
      {
        id: "o1",
        name: "o1",
        description: "Full reasoning model for complex codebases and architectures.",
      },
      {
        id: "gpt-4.5-preview",
        name: "GPT-4.5 Preview",
        description: "OpenAI's latest frontier research preview model.",
      },
    ],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    tagline: "Ultra-cost-effective V3 & R1 reasoning",
    defaultModel: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com",
    envKey: "DEEPSEEK_API_KEY",
    curatedModels: [
      {
        id: "deepseek-chat",
        name: "DeepSeek-V3 (deepseek-chat)",
        description: "Fast, powerful general-purpose and coding model.",
        isRecommended: true,
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek-R1 (deepseek-reasoner)",
        description: "Open-weights reasoning model with explicit chain of thought.",
      },
    ],
  },
  xai: {
    id: "xai",
    name: "xAI (Grok)",
    tagline: "Truth-seeking frontier intelligence",
    defaultModel: "grok-2-latest",
    defaultBaseUrl: "https://api.x.ai/v1",
    envKey: "XAI_API_KEY",
    curatedModels: [
      {
        id: "grok-2-latest",
        name: "Grok 2",
        description: "State-of-the-art reasoning and code comprehension.",
        isRecommended: true,
      },
      {
        id: "grok-2-vision-latest",
        name: "Grok 2 Vision",
        description: "Multimodal Grok model with visual analysis support.",
      },
      {
        id: "grok-beta",
        name: "Grok Beta",
        description: "Early access preview of latest Grok iterations.",
      },
    ],
  },
  groq: {
    id: "groq",
    name: "Groq",
    tagline: "Ultra-fast LPU inference (500+ tokens/sec)",
    defaultModel: "llama-3.3-70b-versatile",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    curatedModels: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B Versatile",
        description: "High-intelligence open model with incredible inference speed.",
        isRecommended: true,
      },
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill Llama 70B",
        description: "Reasoning model running at near-instant Groq LPU speeds.",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant",
        description: "Sub-second turnaround for immediate JSON metadata extraction.",
      },
    ],
  },
  mistral: {
    id: "mistral",
    name: "Mistral AI",
    tagline: "European frontier & specialized Codestral",
    defaultModel: "mistral-large-latest",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    envKey: "MISTRAL_API_KEY",
    curatedModels: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        description: "Top-tier reasoning and multilingual understanding.",
        isRecommended: true,
      },
      {
        id: "codestral-latest",
        name: "Codestral",
        description: "Specialized code generation and codebase inspection model.",
      },
      {
        id: "mistral-small-latest",
        name: "Mistral Small",
        description: "Low-latency, cost-efficient model for quick tasks.",
      },
    ],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    tagline: "Universal routing to 200+ models",
    defaultModel: "auto",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    curatedModels: [
      {
        id: "auto",
        name: "OpenRouter Auto",
        description: "Automatically routes to best-performing model for the task.",
        isRecommended: true,
      },
      {
        id: "google/gemini-2.5-flash",
        name: "Google Gemini 2.5 Flash (via OpenRouter)",
        description: "Routed through OpenRouter API gateway.",
      },
      {
        id: "anthropic/claude-3.7-sonnet",
        name: "Claude 3.7 Sonnet (via OpenRouter)",
        description: "Hybrid reasoning model routed via OpenRouter.",
      },
      {
        id: "deepseek/deepseek-r1",
        name: "DeepSeek R1 (via OpenRouter)",
        description: "Full DeepSeek R1 reasoning via OpenRouter.",
      },
      {
        id: "openai/gpt-4o",
        name: "OpenAI GPT-4o (via OpenRouter)",
        description: "Flagship GPT-4o via OpenRouter.",
      },
    ],
  },
  ollama: {
    id: "ollama",
    name: "Ollama / Local",
    tagline: "Self-hosted private models on localhost",
    defaultModel: "llama3.2",
    defaultBaseUrl: "http://localhost:11434/v1",
    envKey: "OLLAMA_API_KEY",
    curatedModels: [
      {
        id: "llama3.2",
        name: "Llama 3.2 (Local)",
        description: "Meta's efficient lightweight model running locally.",
        isRecommended: true,
      },
      {
        id: "deepseek-r1",
        name: "DeepSeek R1 (Local)",
        description: "Locally served reasoning model.",
      },
      {
        id: "qwen2.5-coder",
        name: "Qwen 2.5 Coder (Local)",
        description: "Specialized code inspection model.",
      },
      {
        id: "mistral",
        name: "Mistral 7B (Local)",
        description: "Reliable general-purpose local model.",
      },
    ],
  },
  custom: {
    id: "custom",
    name: "Custom Provider",
    tagline: "Any OpenAI-compatible API base URL",
    defaultModel: "custom-model",
    defaultBaseUrl: "https://api.together.xyz/v1",
    envKey: "CUSTOM_AI_API_KEY",
    curatedModels: [
      {
        id: "custom-model",
        name: "Custom Model",
        description: "Model hosted on your custom OpenAI-compatible endpoint.",
        isRecommended: true,
      },
    ],
  },
};

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
export const DEFAULT_ANTHROPIC_MODEL = "claude-3-7-sonnet-latest";

export const PROVIDER_NAMES: Record<string, string> = {
  gemini: "Google Gemini",
  anthropic: "Anthropic Claude",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  xai: "xAI (Grok)",
  groq: "Groq",
  mistral: "Mistral AI",
  openrouter: "OpenRouter",
  ollama: "Ollama",
  custom: "Custom Provider",
};
