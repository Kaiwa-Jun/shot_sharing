import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_USERS } from "@/lib/mock-data";
import ConnectionsList from "./connections-list";

export async function generateStaticParams() {
  // Include crew_runteq38 in the static paths
  return [...MOCK_USERS.map(user => ({
    username: user.username
  })), {
    username: 'crew_runteq38'
  }];
}

export default function ConnectionsPage({ params }: { params: { username: string } }) {
  // If the user isn't found in MOCK_USERS, create a temporary mock user for UI display
  const user = params.username === 'crew_runteq38' 
    ? {
        username: 'crew_runteq38',
        name: 'Crew RunTeq',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop',
      }
    : MOCK_USERS.find(u => u.username === params.username);

  if (!user) return null;

  // Generate mock connections
  const followers = MOCK_USERS.filter(u => u.username !== user.username).slice(0, 10);
  const following = MOCK_USERS.filter(u => u.username !== user.username).slice(0, 8);

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
            <p className="text-sm text-muted-foreground">つながり</p>
          </div>
        </div>
      </div>

      <ConnectionsList user={user} followers={followers} following={following} />
    </div>
  );
}