"use client";

import { useState, useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { cn } from "@/lib/utils";
import { ArrowLeft, MoreVertical, Info, LogOut } from "lucide-react";
import { formatTime } from "@/lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InterventionDetails } from "../InterventionDetails";

import { usePresence } from "@/components/providers/PresenceProvider";

export default function ChatWindow({ requestId, currentUser, onBack }) {
  const { onlineUserIds } = usePresence();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInterventionDetails, setShowInterventionDetails] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [requestId]);

  useEffect(() => {
    if (!conversation) return;

    const pusher = getPusherClient();
    const channelName = `presence-conversation-${requestId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-message", (newMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    channel.bind("message-updated", (updatedMessage) => {
      setMessages((prev) => 
        prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m)
      );
    });

    return () => {
      pusher.unsubscribe(channelName);
      channel.unbind_all();
    };
  }, [requestId, conversation, currentUser.id]);

  // Determine if other user is online from global presence
  let otherUserId;
  if (conversation) {
    if (currentUser.role === "TECHNICIAN") {
      otherUserId = conversation.request?.userId;
    } else {
      otherUserId = conversation.request?.appointment?.technician?.user?.id;
    }
  }
  const isOtherUserOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      const conv = data.find((c) => c.requestId === requestId);
      setConversation(conv);
    } catch (error) {
      console.error("Error fetching conversation:", error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${requestId}/messages`);
      const data = await res.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content, attachments = []) => {
    try {
      const res = await fetch(`/api/conversations/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachments }),
      });
      const newMessage = await res.json();
      
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleUpdateMessage = async (messageId, content) => {
    try {
      const res = await fetch(`/api/conversations/${requestId}/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const updatedMessage = await res.json();
      setMessages((prev) => 
        prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m)
      );
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await fetch(`/api/conversations/${requestId}/messages/${messageId}`, {
        method: "DELETE",
      });
      const updatedMessage = await res.json();
      setMessages((prev) => 
        prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m)
      );
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const res = await fetch(`/api/conversations/${requestId}/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const updatedMessage = await res.json();
      setMessages((prev) => 
        prev.map((m) => m.id === updatedMessage.id ? updatedMessage : m)
      );
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  // Determine display name
  let displayName = "Chargement...";
  if (conversation) {
    if (currentUser.role === "TECHNICIAN") {
      displayName = `${conversation.request?.user?.firstName || "Client"} ${conversation.request?.user?.lastName || ""}`;
    } else {
      const tech = conversation.request?.appointment?.technician;
      displayName = tech
        ? `${tech.user?.firstName} ${tech.user?.lastName}`
        : "Technicien";
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 relative">
      {/* Chat Header */}
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {displayName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-none">
              {displayName}
            </h3>
            <p className={cn(
              "text-xs flex items-center gap-1 transition-colors duration-500",
              isOtherUserOnline ? "text-green-500" : "text-slate-400"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                isOtherUserOnline ? "bg-green-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
              )} />
              {isOtherUserOnline ? "En ligne" : "Hors ligne"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl border-none shadow-2xl p-2 bg-white dark:bg-slate-900 border border-slate-100"
            >
              <DropdownMenuItem
                onClick={() => setShowInterventionDetails(true)}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">
                  Détails de l'intervention
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onBack}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  Fermer la discussion
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {loading ? (
          <div className="flex items-center justify-center h-20 text-slate-400 text-sm">
            Chargement des messages...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id || `temp-${idx}`}
              message={msg}
              isOwn={msg.senderId === currentUser.id}
              currentUserId={currentUser.id}
              onUpdate={(content) => handleUpdateMessage(msg.id, content)}
              onDelete={() => handleDeleteMessage(msg.id)}
              onReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
            />
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <ChatInput onSend={handleSendMessage} />
      </div>

      <InterventionDetails
        intervention={conversation?.request}
        open={showInterventionDetails}
        onOpenChange={setShowInterventionDetails}
        role={currentUser.role}
      />
    </div>
  );
}
