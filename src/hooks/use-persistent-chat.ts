import { useState, useCallback } from "react";
import { useMessages } from "./use-messages";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: string;
  created_at: string;
}

interface UsePersistentChatProps {
  teamId?: string;
  instanceId?: string;
  type?: "agent" | "general";
  chatId?: string;
}

export function usePersistentChat({
  teamId,
  instanceId,
  type = "general",
  chatId: initialChatId,
}: UsePersistentChatProps = {}) {
  const { messages, setMessages, isLoading, sendMessage: originalSendMessage } = useMessages({
    teamId,
    instanceId,
    type,
  });
  const { getAccessToken, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [chatId, setChatId] = useState<string | undefined>(initialChatId);

  const initializeChat = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to create chat");

      const chat: Chat = await response.json();
      setChatId(chat.id);
      return chat.id;
    } catch (error) {
      console.error("Error initializing chat:", error);
      toast({
        variant: "destructive",
        title: "Failed to initialize chat",
        description: "Please try again later",
      });
    }
  }, [getAccessToken, isAuthenticated, toast]);

  const loadMessages = useCallback(async (id: string) => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chats/${id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load messages");

      const messages: Message[] = await response.json();
      setMessages(messages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast({
        variant: "destructive",
        title: "Failed to load messages",
        description: "Please try again later",
      });
    }
  }, [getAccessToken, isAuthenticated, setMessages, toast]);

  const saveMessage = useCallback(async (id: string, message: Message) => {
    if (!isAuthenticated) return;

    try {
      const token = await getAccessToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/${id}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("Error saving message:", error);
      // Don't show toast here as it's not critical for UX
    }
  }, [getAccessToken, isAuthenticated]);

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId) {
      const newChatId = await initializeChat();
      if (!newChatId) return;
      setChatId(newChatId);
    }

    // First save the user's message
    const userMessage: Message = { role: "user", content };
    await saveMessage(chatId, userMessage);

    // Then send it through the original sendMessage function
    await originalSendMessage(content);

    // The assistant's message will be saved after it's received
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      await saveMessage(chatId, lastMessage);
    }
  }, [chatId, initializeChat, saveMessage, originalSendMessage, messages]);

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    chatId,
    loadMessages,
  };
}
