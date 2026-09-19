import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedUsers() {
  // ⚠️ Contraseñas de demo triviales a propósito, solo para probar el login
  // en desarrollo. Cambiarlas (o borrar estos usuarios) antes de producción
  // — ver README, sección "Credenciales de seed".
  const demoUsers = [
    { username: "admin", name: "Admin Demo", password: "admin123", role: "ADMIN" as const },
    { username: "cotizador", name: "Cotizador Demo", password: "cotizador123", role: "COTIZADOR" as const },
  ];

  for (const demo of demoUsers) {
    const passwordHash = await bcrypt.hash(demo.password, 10);
    await prisma.user.upsert({
      where: { username: demo.username },
      update: {},
      create: {
        username: demo.username,
        name: demo.name,
        passwordHash,
        role: demo.role,
      },
    });
  }

  console.log("Usuarios demo listos: admin/admin123 (ADMIN), cotizador/cotizador123 (COTIZADOR)");
}

async function seedCompanySettings() {
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Empresa Demo",
      phone: "0000-0000",
      email: "demo@empresa.test",
      address: "Dirección demo, Guatemala",
      commercialTerms: null,
      defaultDepositPercentage: 50,
    },
  });

  console.log("CompanySettings demo listo.");
}

async function seedEquipment() {
  const count = await prisma.equipment.count();
  if (count > 0) {
    console.log("Equipment ya tiene datos, se omite el seed.");
    return;
  }

  await prisma.equipment.createMany({
    data: [
      { name: "Split Demo 12,000 BTU", brand: "Demo", model: "D-12", btu: 12000, type: "Split", price: 0 },
      { name: "Split Demo 18,000 BTU", brand: "Demo", model: "D-18", btu: 18000, type: "Split", price: 0 },
      { name: "Split Demo 24,000 BTU", brand: "Demo", model: "D-24", btu: 24000, type: "Split", price: 0 },
      { name: "Cassette Demo 24,000 BTU", brand: "Demo", model: "C-24", btu: 24000, type: "Cassette", price: 0 },
      { name: "Multi Split Demo 12,000 BTU", brand: "Demo", model: "M-12", btu: 12000, type: "Multi Split", price: 0 },
    ],
  });

  console.log("Equipment demo creado (5 equipos a Q 0.00).");
}

async function seedInstallationKits() {
  const count = await prisma.installationKit.count();
  if (count > 0) {
    console.log("InstallationKit ya tiene datos, se omite el seed.");
    return;
  }

  await prisma.installationKit.createMany({
    data: [
      { minMeters: 0, maxMeters: 5, price: 0 },
      { minMeters: 5, maxMeters: 10, price: 0 },
      { minMeters: 10, maxMeters: 15, price: 0 },
      { minMeters: 15, maxMeters: 20, price: 0 },
      { minMeters: 20, maxMeters: 25, price: 0 },
    ],
  });

  console.log("InstallationKit demo creado (rangos 0-25m a Q 0.00).");
}

async function seedComplexities() {
  const demoComplexities = [
    { level: 1, name: "Sencilla", description: "Instalación normal, sin trabajos especiales.", adjustment: 0 },
    { level: 2, name: "Media", description: "Requiere trabajos adicionales.", adjustment: 0 },
    { level: 3, name: "Compleja", description: "Requiere bastante trabajo adicional.", adjustment: 0 },
  ];

  for (const demo of demoComplexities) {
    await prisma.complexity.upsert({
      where: { level: demo.level },
      update: {},
      create: demo,
    });
  }

  console.log("Complexity demo lista (niveles 1-3 a Q 0.00).");
}

async function main() {
  await seedUsers();
  await seedCompanySettings();
  await seedEquipment();
  await seedInstallationKits();
  await seedComplexities();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
