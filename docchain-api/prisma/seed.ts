import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Seed de demonstração: cria (ou mantém) a conta usada na apresentação.
 * Documentos não são semeados porque precisam de registro on-chain real;
 * a demo registra os arquivos ao vivo pela interface.
 *
 * Uso: npx prisma db seed
 * Variáveis opcionais: SEED_DEMO_EMAIL, SEED_DEMO_PASSWORD, SEED_DEMO_NAME
 */
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.SEED_DEMO_EMAIL ?? 'demo@docchain.dev';
  const password = process.env.SEED_DEMO_PASSWORD ?? 'DocChain@2026';
  const name = process.env.SEED_DEMO_NAME ?? 'Conta Demo';

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name },
  });

  console.log(`Usuário demo pronto: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
