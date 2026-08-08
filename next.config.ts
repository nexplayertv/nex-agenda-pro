import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // logo_url e imagem_capa_url sao campos de texto livre em Configuracoes
    // (o dono do negocio cola o link de onde quiser hospedar) - por isso o
    // padrao remoto precisa aceitar qualquer host https, nao um so.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
