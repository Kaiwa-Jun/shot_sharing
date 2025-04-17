import { prisma } from "@/lib/prisma";
import { User, Prisma } from "@prisma/client";
import { supabase } from "@/lib/supabase";

/**
 * Supabase Authのユーザー情報をPrismaデータベースと同期するサービス
 */
export class UserService {
  /**
   * ユーザーの取得またはSupabase認証後のユーザーデータに基づく作成
   * @param supabaseUserId Supabase Auth のユーザーID
   * @param email ユーザーのメールアドレス
   * @param userData 追加のユーザーデータ
   * @returns 作成または取得されたユーザー
   */
  static async getOrCreateUser(
    supabaseUserId: string,
    email: string,
    userData?: {
      instagramUrl?: string;
      twitterUrl?: string;
      bio?: string;
      name?: string;
      avatarUrl?: string;
    }
  ): Promise<User> {
    try {
      // すでに存在するユーザーを検索
      const existingUser = await prisma.user.findUnique({
        where: { id: supabaseUserId },
      });

      // 既存のユーザーが見つかった場合はそれを返す
      if (existingUser) {
        // プロフィール情報の更新が必要な場合は更新する
        if (
          userData &&
          Object.keys(userData).some(
            (key) => userData[key as keyof typeof userData] !== undefined
          )
        ) {
          return await prisma.user.update({
            where: { id: supabaseUserId },
            data: {
              instagramUrl: userData.instagramUrl ?? existingUser.instagramUrl,
              twitterUrl: userData.twitterUrl ?? existingUser.twitterUrl,
              bio: userData.bio ?? existingUser.bio,
              name: userData.name ?? existingUser.name,
              avatarUrl: userData.avatarUrl ?? existingUser.avatarUrl,
            },
          });
        }
        return existingUser;
      }

      // 新しいユーザーを作成
      const newUser = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email: email,
          instagramUrl: userData?.instagramUrl || null,
          twitterUrl: userData?.twitterUrl || null,
          bio: userData?.bio || null,
          name: userData?.name || null,
          avatarUrl: userData?.avatarUrl || null,
        },
      });

      return newUser;
    } catch (error) {
      console.error("ユーザー取得/作成エラー:", error);
      throw error;
    }
  }

  /**
   * 現在のSupabase認証ユーザーを取得し、Prismaと同期
   * @returns 現在のユーザーまたはnull
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data } = await supabase.auth.getUser();
      const supabaseUser = data.user;

      if (!supabaseUser) {
        return null;
      }

      // Prismaユーザーを取得または作成
      const user = await this.getOrCreateUser(
        supabaseUser.id,
        supabaseUser.email || "",
        {
          // ユーザーメタデータからプロフィール情報を取得（存在する場合）
          instagramUrl: supabaseUser.user_metadata?.instagram_url,
          twitterUrl: supabaseUser.user_metadata?.twitter_url,
          bio: supabaseUser.user_metadata?.bio,
          name:
            supabaseUser.user_metadata?.name ||
            supabaseUser.user_metadata?.full_name,
          avatarUrl: supabaseUser.user_metadata?.avatar_url,
        }
      );

      return user;
    } catch (error) {
      console.error("現在のユーザー取得エラー:", error);
      return null;
    }
  }

  /**
   * ユーザー情報の更新
   * @param userId ユーザーID
   * @param data 更新するデータ
   * @returns 更新されたユーザー
   */
  static async updateUser(
    userId: string,
    data: {
      instagramUrl?: string;
      twitterUrl?: string;
      bio?: string;
      name?: string;
      avatarUrl?: string;
    }
  ): Promise<User> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          instagramUrl: data.instagramUrl,
          twitterUrl: data.twitterUrl,
          bio: data.bio,
          name: data.name,
          avatarUrl: data.avatarUrl,
        },
      });

      // Supabaseのユーザーメタデータも更新
      await supabase.auth.updateUser({
        data: {
          instagram_url: data.instagramUrl,
          twitter_url: data.twitterUrl,
          bio: data.bio,
          name: data.name,
          avatar_url: data.avatarUrl,
        },
      });

      return updatedUser;
    } catch (error) {
      console.error("ユーザー更新エラー:", error);
      throw error;
    }
  }

  /**
   * ユーザーID（Supabase Auth ID）でユーザーを検索
   * @param userId ユーザーID
   * @returns ユーザーまたはnull
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      console.error("ユーザー検索エラー:", error);
      return null;
    }
  }

  /**
   * メールアドレスでユーザーを検索
   * @param email メールアドレス
   * @returns ユーザーまたはnull
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      console.error("ユーザー検索エラー:", error);
      return null;
    }
  }
}
