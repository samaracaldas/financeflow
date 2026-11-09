import mongoose from "mongoose";

const RETRY_DELAY_MS = 10_000;

/**
 * Conecta no MongoDB sem derrubar o processo em caso de falha.
 * Antes, um erro de conexão chamava process.exit(1): no Render isso vira um
 * crash loop silencioso (a API nunca responde). Agora o servidor sobe, o
 * /api/health mostra o estado do banco e a conexão é tentada de novo.
 */
const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("[db] MONGO_URI não definida. Configure a variável de ambiente.");
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    console.log("[db] MongoDB conectado");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] Erro ao conectar no MongoDB: ${message}`);
    console.error(`[db] Nova tentativa em ${RETRY_DELAY_MS / 1000}s`);
    setTimeout(connectDB, RETRY_DELAY_MS);
  }
};

export const dbState = (): string =>
  ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] ?? "unknown";

export default connectDB;
