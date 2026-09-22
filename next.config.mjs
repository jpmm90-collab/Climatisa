/** @type {import('next').NextConfig} */
const nextConfig = {
  // bcrypt (src/lib/auth.ts) es un módulo nativo (binario .node compilado),
  // no JS puro. Sin esto, el bundler de Server Components de Next intenta
  // empaquetarlo como si fuera JS normal en vez de tratarlo como una
  // dependencia externa de Node, lo que rompe la carga del binario nativo
  // en el build de Vercel (funciona en local por coincidencia de plataforma,
  // no por estar bien configurado).
  experimental: {
    serverComponentsExternalPackages: ["bcrypt"],
  },
};

export default nextConfig;
