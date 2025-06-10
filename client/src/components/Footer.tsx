import { Book, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="relative border-t border-gray-800/50 bg-gradient-to-r from-black/80 via-purple-900/20 to-pink-900/20 backdrop-blur-sm">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/3 w-24 h-24 bg-gradient-to-br from-blue-600/15 to-purple-600/15 rounded-full blur-xl animate-float"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex flex-col items-center justify-center space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-pink-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-2">
              AURA
            </h3>
            <p className="text-gray-400 text-sm sm:text-base">
              The Web3 Aura Battle Platform
            </p>
          </div>

          {/* Documentation Link */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 text-white hover:bg-gradient-to-r hover:from-purple-600/40 hover:to-pink-600/40 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 group"
            >
              <a
                href="https://aura-13.gitbook.io/aura/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <Book className="w-5 h-5 group-hover:text-purple-300 transition-colors" />
                <span className="font-semibold">Read Documentation</span>
                <ExternalLink className="w-4 h-4 group-hover:text-purple-300 transition-colors" />
              </a>
            </Button>


          </div>

          {/* Footer Text */}
          <div className="text-center text-gray-500 text-xs sm:text-sm border-t border-gray-800/50 pt-6 w-full">
            <p>&copy; 2025 Aura Platform. Built on Base Sepolia Testnet.</p>
            <p className="mt-1">Transforming Web3 education through gamified social learning.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}