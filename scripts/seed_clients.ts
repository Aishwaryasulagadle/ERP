import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, clientCode: true, departmentType: true, userId: true },
  });

  console.log(`Found ${clients.length} clients`);
  const passwordHash = await bcrypt.hash("client123", 10);

  for (const client of clients) {
    const slug = client.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const email = `client.${slug}@erp.com`;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          name: `${client.name} (Client)`,
          role: "CLIENT",
        },
      });
      console.log(`Created user ${user.email} with id ${user.id}`);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          role: "CLIENT",
        },
      });
      console.log(`Updated user ${user.email}`);
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { userId: user.id },
    });
    console.log(`Linked client ${client.name} -> ${user.email}`);
  }

  // Ensure 1 demo complaint exists
  const firstClient = clients[0];
  if (firstClient) {
    const existing = await prisma.employeeQuery.findFirst({
      where: { clientId: firstClient.id },
    });
    if (!existing) {
      await prisma.employeeQuery.create({
        data: {
          queryCode: `QRY-CLI-${Date.now().toString().slice(-4)}`,
          subject: `[${firstClient.name}] Request update on monthly social media deliverables`,
          description: "Hi team, please share the schedule and drafts for upcoming weekly deliverables.",
          category: "CLIENT_DELIVERABLE_DELAY",
          priority: "HIGH",
          status: "PENDING",
          clientId: firstClient.id,
        },
      });
      console.log(`Created demo client complaint for ${firstClient.name}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
