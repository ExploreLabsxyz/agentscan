import { useState } from "react";
import { useToast } from "./use-toast";
import { logEvent } from "@/lib/amplitude";
import { useAuth } from "./use-auth";

interface UseMessagesProps {
  teamId?: string;
  instanceId?: string;
  type?: "agent" | "general";
}

export function useMessages({
  teamId,
  instanceId,
  type = "general",
}: UseMessagesProps = {}) {
  const { getAccessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    const accessToken = await getAccessToken();

    const userMessage = { role: "user", content: message };
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
            ...(type === "agent" && { type, instance: instanceId }),
          }),
        }
      );

      if (response.status === 429) {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: data.message || "Please try again later",
        });
        return;
      }

      try {
        logEvent("conversation_made", {
          teamId: teamId || "",
          question: message,
          source: "web",
          messages: messages,
          ...(type === "agent" && { type, instance: instanceId }),
        });
      } catch (error) {
        console.error("Error logging event:", error);
      }

      if (!response.ok) throw new Error("Network response was not ok");

      const assistantMessage = { role: "assistant", content: "" };
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
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage,
  };
}
