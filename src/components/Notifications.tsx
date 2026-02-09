import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, CheckCheck, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await api.getNotifications();
      setNotifications(result.notifications || []);
      setUnreadCount(result.notifications?.filter((n: any) => !n.read).length || 0);
    } catch (error: any) {
      console.error('Failed to load notifications:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await api.markNotificationRead(notificationId);
      loadNotifications();
    } catch (error: any) {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      toast.success('All notifications marked as read');
      loadNotifications();
    } catch (error: any) {
      toast.error(`Failed to mark all as read: ${error.message}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_required':
        return <AlertCircle className="size-5 text-orange-500" />;
      case 'approval_approved':
        return <CheckCircle className="size-5 text-green-500" />;
      case 'approval_rejected':
        return <XCircle className="size-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="size-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="size-5 text-yellow-500" />;
      default:
        return <Info className="size-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'approval_required':
        return <Badge className="bg-orange-500">Action Required</Badge>;
      case 'approval_approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'approval_rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="outline">Info</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="size-8" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Stay updated with approval requests and system events</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllRead}>
            <CheckCheck className="size-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Recent Notifications ({notifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="size-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">No notifications yet</p>
              <p className="text-sm">You'll see approval requests and system updates here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.read
                      ? 'bg-gray-50 border-gray-200'
                      : 'bg-blue-50 border-blue-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          <p className={`text-sm mt-1 ${!notification.read ? 'text-blue-700' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getNotificationBadge(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatTimeAgo(notification.created_at)}</span>
                          {notification.related_module && (
                            <>
                              <span>•</span>
                              <span className="font-medium">{notification.related_module}</span>
                            </>
                          )}
                        </div>
                        
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkRead(notification.id)}
                            className="text-xs"
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="size-5" />
            Notification Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Approval Required</p>
                <p className="text-gray-600 text-xs">When a document needs your approval</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <CheckCircle className="size-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Approved</p>
                <p className="text-gray-600 text-xs">When your document is approved</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <XCircle className="size-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Rejected</p>
                <p className="text-gray-600 text-xs">When your document is rejected</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Info className="size-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Info</p>
                <p className="text-gray-600 text-xs">General system notifications</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
