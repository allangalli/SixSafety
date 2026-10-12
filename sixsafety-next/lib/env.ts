/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 * Fails fast with clear error messages if configuration is invalid
 */

interface EnvConfig {
  // OpenAI
  OPENAI_API_KEY: string;

  // Pinecone
  PINECONE_API_KEY: string;
  PINECONE_INDEX: string;

  // LangSmith (optional but recommended)
  LANGSMITH_API_KEY?: string;
  LANGSMITH_PROJECT?: string;
  LANGCHAIN_TRACING_V2?: string;

  // Node environment
  NODE_ENV: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 * Call this at application startup (in layout.tsx or middleware)
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const required = [
    { key: "OPENAI_API_KEY", description: "OpenAI API key for LLM calls" },
    {
      key: "PINECONE_API_KEY",
      description: "Pinecone API key for vector database",
    },
    {
      key: "PINECONE_INDEX",
      description: "Pinecone index name for safety resources",
    },
  ];

  // Check required variables
  for (const { key, description } of required) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      errors.push(`Missing required environment variable: ${key} (${description})`);
    }
  }

  // Optional but recommended variables
  const optional = [
    {
      key: "LANGSMITH_API_KEY",
      description: "LangSmith API key for tracing (recommended for debugging)",
    },
    {
      key: "LANGSMITH_PROJECT",
      description: "LangSmith project name",
    },
  ];

  for (const { key, description } of optional) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      warnings.push(`Optional environment variable not set: ${key} (${description})`);
    }
  }

  // Validate API key formats
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && !openaiKey.startsWith("sk-")) {
    errors.push(
      "OPENAI_API_KEY appears invalid (should start with 'sk-')"
    );
  }

  const langsmithKey = process.env.LANGSMITH_API_KEY;
  if (langsmithKey && !langsmithKey.startsWith("lsv2_")) {
    warnings.push(
      "LANGSMITH_API_KEY appears invalid (should start with 'lsv2_')"
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get typed environment configuration
 * Throws error if environment is invalid
 */
export function getEnv(): EnvConfig {
  const validation = validateEnv();

  if (!validation.valid) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nPlease check your .env.local file and restart the server.");
    throw new Error("Invalid environment configuration");
  }

  if (validation.warnings.length > 0) {
    console.warn("⚠️  Environment warnings:");
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    PINECONE_API_KEY: process.env.PINECONE_API_KEY!,
    PINECONE_INDEX: process.env.PINECONE_INDEX!,
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
    LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
    LANGCHAIN_TRACING_V2: process.env.LANGCHAIN_TRACING_V2,
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if LangSmith tracing is enabled
 */
export function isTracingEnabled(): boolean {
  return process.env.LANGCHAIN_TRACING_V2 === "true";
}

// Validate environment on module load (server-side only)
if (typeof window === "undefined") {
  const validation = validateEnv();

  if (!validation.valid) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ENVIRONMENT CONFIGURATION ERROR");
    console.error("=".repeat(60));
    console.error("\nThe following required environment variables are missing:\n");
    validation.errors.forEach((error) => console.error(`  • ${error}`));
    console.error("\nTo fix this:");
    console.error("  1. Copy .env.local.example to .env.local");
    console.error("  2. Fill in all required API keys");
    console.error("  3. Restart the development server\n");
    console.error("=".repeat(60) + "\n");

    // In development, show error in console but don't crash
    // In production, fail fast
    if (isProduction()) {
      process.exit(1);
    }
  }

  if (validation.warnings.length > 0 && isDevelopment()) {
    console.warn("\n⚠️  Optional configuration recommendations:\n");
    validation.warnings.forEach((warning) => console.warn(`  • ${warning}`));
    console.warn("");
  }

  if (validation.valid && isDevelopment()) {
    console.log("✅ Environment configuration valid\n");
  }
}
