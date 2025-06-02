import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Swords, Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery({
    queryKey: ["/api/notifications"],
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    retry: false,
  });

  const markAsRead = async (notificationId: string) => {
    try {
      console.log("Marking notification as read:", notificationId);
      await apiRequest("POST", `/api/notifications/${notificationId}/read`);
      // Force immediate refetch to update the UI
      await refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "battle_challenge":
        return <Swords className="w-4 h-4 text-orange-500" />;
      case "battle_accepted":
        return <Trophy className="w-4 h-4 text-green-500" />;
      case "battle_rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleAcceptChallenge = async (battleId: string) => {
    try {
      await apiRequest('POST', `/api/battles/${battleId}/accept`);
      refetch();
    } catch (error) {
      console.error("Error accepting challenge:", error);
    }
  };

  const handleRejectChallenge = async (battleId: string) => {
    try {
      await apiRequest('POST', `/api/battles/${battleId}/reject`);
      refetch();
    } catch (error) {
      console.error("Error rejecting challenge:", error);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-gray-500 mt-1">Click on messages to mark as read</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    notification.isRead 
                      ? "bg-gray-50 dark:bg-gray-800/50" 
                      : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#5c5252]">{notification.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                      
                      {notification.type === "battle_challenge" && notification.relatedId && (
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            className="h-6 text-xs"
                            onClick={() => handleAcceptChallenge(notification.relatedId!)}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => handleRejectChallenge(notification.relatedId!)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}