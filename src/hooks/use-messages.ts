/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useToast } from "./use-toast";
import { logEvent } from "@/lib/amplitude";
import { useAuth } from "./use-auth";
import { useAgent } from "@/contexts/AgentContext";

interface UseMessagesProps {
  teamId?: string;
  instanceId?: string;
  type?: "agent" | "general";
  sessionId?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function useMessages({
  teamId,
  instanceId,
  type = "general",
  sessionId: initialSessionId,
}: UseMessagesProps = {}) {
  const { getAccessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(initialSessionId);
  const { toast } = useToast();
  const { setShowAuthDialog } = useAgent();
  const { isAuthenticated } = useAuth();

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    const accessToken = await getAccessToken();

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/conversation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            question: message,
            messages: [...messages, userMessage],
            teamId,
            sessionId: currentSessionId,
            ...(type === "agent" && { type, instance: instanceId }),
          }),
        }
      );

      if (response.status === 429) {
        const data = await response.json();
        if (!isAuthenticated) {
          setShowAuthDialog(true);
        } else {
          toast({
            variant: "destructive",
            title: data.message || "Please try again later",
          });
        }
        setMessages((prev) => prev.filter((msg) => msg !== userMessage));
        return;
      }

      try {
        logEvent("conversation_made", {
          teamId: teamId || "",
          question: message,
          source: "web",
          messages: messages,
          ...(type === "agent" && { type, instance: instanceId }),
          type,
        });
      } catch (error: any) {
        console.error("Error logging event:", error);
      }

      if (!response.ok) throw new Error("Network response was not ok");

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const jsonStr = line.replace(/^data: /, "").trim();
              const parsed = JSON.parse(jsonStr);

              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = fullContent;
                  return newMessages;
                });
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      try {
        logEvent("conversation_completed", {
          teamId: teamId || "",
          question: message,
          source: "web",
          answer: fullContent,
          type,
          ...(type === "agent" && { instance: instanceId }),
        });
      } catch (error) {
        console.error("Error logging completion event:", error);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Please try again later",
      });
      setMessages((prev) => prev.filter((msg) => msg !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
    currentSessionId,
    setCurrentSessionId,
  };
}
