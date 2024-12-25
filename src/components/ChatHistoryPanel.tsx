"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Clock } from "lucide-react";
import { Chat } from "@/types";

interface ChatHistoryPanelProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatHistoryPanel({
  onSelectChat,
  selectedChatId,
}: ChatHistoryPanelProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessToken, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchChats = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const token = await getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch chats");

      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        variant: "destructive",
        title: "Failed to load chat history",
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const memoizedFetchChats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const token = await getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch chats");

      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      toast({
        variant: "destructive",
        title: "Failed to load chat history",
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, getAccessToken, toast]);

  useEffect(() => {
    memoizedFetchChats();
  }, [memoizedFetchChats]);

  const handleNewChat = () => {
    onSelectChat("");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full max-w-sm border-r border-gray-200 h-full bg-gray-50">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold mb-2">Chat History</h2>
        <Button
          onClick={handleNewChat}
          variant="outline"
          className="w-full justify-start"
        >
          <ChevronRight className="h-4 w-4 mr-2" />
          Start New Chat
        </Button>
      </div>
      <div className="overflow-y-auto h-[calc(100%-5rem)]">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No chat history</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                variant="ghost"
                className={`w-full justify-start p-4 hover:bg-gray-100 ${
                  selectedChatId === chat.id ? "bg-gray-100" : ""
                }`}
              >
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(chat.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
