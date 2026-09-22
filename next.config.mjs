/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit (usado internamente por @react-pdf/renderer, src/lib/pdf/) carga
  // sus fuentes estándar (.cjs + .afm) con un require() dinámico que el
  // output file tracing de Next/Vercel no detecta de forma estática, así
  // que el binario de la función serverless no incluye esos archivos y el
  // endpoint de PDF falla en producción con "Cannot find module
  // '.../pdfkit/js/standard-fonts/Helvetica.cjs'" aunque funcione en local.
  // Se fuerza su inclusión explícita en el trace de esta ruta.
  experimental: {
    outputFileTracingIncludes: {
      "/api/quotes/[id]/pdf": ["./node_modules/pdfkit/js/**/*"],
    },
  },
};

export default nextConfig;
