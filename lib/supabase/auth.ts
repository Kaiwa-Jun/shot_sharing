import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { prisma } from "../prisma";

export const syncUserWithDatabase = async () => {
  const supabase = createClientComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Prismaデータベースでユーザーを検索または作成
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email,
      lastSignInAt: new Date(),
    },
    create: {
      id: user.id,
      email: user.email,
      createdAt: new Date(),
      lastSignInAt: new Date(),
    },
  });

  return dbUser;
};

export const getCurrentUser = async () => {
  const supabase = createClientComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return dbUser;
};
