import { PostFeed } from "@/components/post-feed";

// 動的レンダリングを強制する
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto">
      <PostFeed />
    </div>
  );
}
