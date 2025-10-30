import { useParams } from "wouter";
import UserProfile from "@/components/UserProfile";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950 p-6">
        <div className="max-w-5xl mx-auto pt-8">
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
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-cyan-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Navigation */}
        <Link href="/leaderboard" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-lg">Back to Leaderboard</span>
        </Link>

        {/* User Profile */}
        <UserProfile userId={userId} />
      </div>
    </div>
  );
}