"use client";

import { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import { cn } from "@/lib/utils";
import { ArrowLeft, MoreVertical, Info, LogOut, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InterventionDetails } from "@/features/interventions/components/InterventionDetails";
import { usePresence } from "@/features/notifications/context/PresenceContext";
import { useChat } from "@/features/chat/context/ChatContext";

export default function ChatWindow({ currentUser }) {
  const { onlineUserIds } = usePresence();
  const {
    selectedRequestId: requestId,
    selectConversation,
    messages,
    conversation,
    intervention,
    messagesLoading: loading,
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleReaction
  } = useChat();

  const [showInterventionDetails, setShowInterventionDetails] = useState(false);
  const scrollRef = useRef(null);

  let otherUserId;
  if (conversation) {
    if (currentUser.role === "TECHNICIAN") {
      otherUserId = conversation.request?.userId;
    } else {
      otherUserId = conversation.request?.technicianId;
    }
  }
  const isOtherUserOnline = otherUserId ? onlineUserIds.has(otherUserId) : false;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  let displayName = "Chargement...";
  if (conversation) {
    if (currentUser.role === "TECHNICIAN") {
      displayName = `${conversation.request?.user?.firstName || "Client"} ${conversation.request?.user?.lastName || ""}`;
    } else {
      const tech = conversation.request?.technician;
      displayName = tech
        ? `${tech.firstName} ${tech.lastName}`
        : "Technicien";
    }
  } else if (intervention) {
    if (currentUser.role === "TECHNICIAN") {
      displayName = `${intervention.user?.firstName || "Client"} ${intervention.user?.lastName || ""}`;
    } else {
      const tech = intervention.technician;
      displayName = tech
        ? `${tech.firstName} ${tech.lastName}`
        : "Technicien";
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 relative">
      <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => selectConversation(null)}
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
                onClick={() => selectConversation(null)}
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

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
            <span className="text-sm font-medium">Chargement des messages...</span>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id || `temp-${idx}`}
              message={msg}
              isOwn={msg.senderId === currentUser.id}
              currentUserId={currentUser.id}
              onUpdate={(content) => updateMessage(msg.id, content)}
              onDelete={() => deleteMessage(msg.id)}
              onReaction={(emoji) => toggleReaction(msg.id, emoji)}
            />
          ))
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        <ChatInput onSend={sendMessage} />
      </div>

      <InterventionDetails
        intervention={conversation?.request || intervention}
        open={showInterventionDetails}
        onOpenChange={setShowInterventionDetails}
        role={currentUser.role}
      />
    </div>
  );
}
