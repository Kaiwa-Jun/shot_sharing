import { MOCK_USERS } from "@/lib/mock-data";
import FollowingList from "./following-list";

export async function generateStaticParams() {
  return MOCK_USERS.map((user) => ({
    username: user.username,
  }));
}

export const dynamic = "force-dynamic";

export default function FollowingPage({
  params,
}: {
  params: { username: string };
}) {
  const user = MOCK_USERS.find((u) => u.username === params.username);
  if (!user) return null;

  // Generate mock following users
  const following = MOCK_USERS.filter(
    (u) => u.username !== user.username
  ).slice(0, 8);

  return <FollowingList user={user} following={following} />;
}
