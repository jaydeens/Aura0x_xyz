import { useParams } from "wouter";
import UserProfile from "@/components/UserProfile";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Card className="bg-black/40 border border-red-500/20">
            <CardContent className="pt-6">
              <div className="text-center text-red-400">Invalid user ID</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>

        {/* User Profile */}
        <UserProfile userId={userId} />
      </div>
    </div>
  );
}