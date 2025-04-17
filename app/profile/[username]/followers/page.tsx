import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_USERS } from "@/lib/mock-data";
import FollowersList from "./followers-list";

export async function generateStaticParams() {
  return MOCK_USERS.map(user => ({
    username: user.username
  }));
}

export default function FollowersPage({ params }: { params: { username: string } }) {
  const user = MOCK_USERS.find(u => u.username === params.username);
  if (!user) return null;

  // Generate mock followers
  const followers = MOCK_USERS.filter(u => u.username !== user.username).slice(0, 10);

  return (
    <div className="container max-w-2xl mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/profile/${params.username}`}>
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <p className="text-sm text-muted-foreground">フォロワー</p>
          </div>
        </div>
      </div>

      <FollowersList followers={followers} />
    </div>
  );
}