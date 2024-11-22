/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";

import { Send, Bot, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import AnimatedRobot from "@/components/AnimatedRobot";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const [query, setQuery] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi there 👋 - this is Andy the agent. What would you like to learn about me?`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const exampleQuestions = [
    "What is an OLAS Agent?",
    "Give me an example of an OLAS Agent",
    "Show me a agent that predicts prediction markets",
    "How does the trader agent work?",
    "How do I make my own agent?",
    "Can you tell me how to stake OLAS in the easiest way possible?",
    "Give me content I can look at to learn more about OLAS",
  ];

  const [showExternalDialog, setShowExternalDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState("");

  const ExternalLinkDialog = () => (
    <AlertDialog open={showExternalDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leaving Agentscan</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to leave Agentscan to visit an external website.
            Please note that we cannot guarantee the safety or reliability of
            external sites. Use any external software at your own risk.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowExternalDialog(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              window.open(pendingUrl, "_blank");
              setShowExternalDialog(false);
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user has scrolled up
      const isScrolledUp =
        container.scrollHeight - container.scrollTop - container.clientHeight >
        50;
      setUserScrolled(isScrolledUp);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || userScrolled) return;

    // Only auto-scroll if user hasn't scrolled up
    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }, [messages, userScrolled]);

  const [isStreaming, setIsStreaming] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsStreaming(true);
    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);
    const newMessages = [...messages, userMessage];

    try {
      const response = await fetch(
        "https://agentscan-express-production.up.railway.app/conversation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: query,
            messages: newMessages,
          }),
        }
      );

      if (!response.ok) throw new Error("Network response was not ok");

      // Add initial assistant message
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

      if (buffer.trim()) {
        try {
          const jsonStr = buffer.replace(/^data: /, "").trim();
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
        } catch (e) {}
      }
    } catch (error) {
      console.error("Error:", error);
      handleError();
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Helper function to handle errors
  const handleError = () => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage.role === "assistant" && !lastMessage.content) {
        lastMessage.content =
          "Sorry, there was an error processing your request. Please try again.";
      }
      return newMessages;
    });
    setIsLoading(false);
  };

  const handleQuestionClick = (question: string) => {
    setQuery(question);
    handleSubmit(new Event("submit") as unknown as React.FormEvent<Element>);
  };

  return (
    <div className="bg-white flex flex-col relative overflow-hidden">
      <motion.main
        className="flex-grow container mx-auto px-4 py-8 max-w-5xl flex flex-col justify-center"
        initial={false}
        animate={{
          x: "-100%",
          opacity: 0,
          display: "none",
        }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Landing page content */}
        <div className="min-h-screen bg-white flex flex-col relative">
          <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl flex flex-col justify-center relative"></main>
        </div>
      </motion.main>

      <motion.div
        initial={false}
        animate={{
          x: 0,
          opacity: 1,
          display: "block",
        }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.3,
        }}
      >
        {/* Chat interface */}
        <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl flex flex-col justify-center">
          <Card className="w-full max-w-5xl mx-auto h-[65vh] flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto mb-4"
              >
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex mb-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start gap-3 max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse"
                          : "flex-row"
                      }`}
                    >
                      <div
                        className={`${
                          message.role === "user" ? "hidden" : "block"
                        }`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-purple-100">
                            <AnimatedRobot scale={0.2} />
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <motion.div
                        initial="initial"
                        animate="animate"
                        variants={{
                          initial: {
                            opacity: 0,
                            x: message.role === "user" ? 20 : -20,
                          },
                          animate: { opacity: 1, x: 0 },
                        }}
                        transition={{
                          duration: 0.8,
                          ease: "easeOut",
                        }}
                        className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-purple-500 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <div
                          className={`prose prose-sm dark:prose-invert max-w-none ${
                            message.role === "user"
                              ? "prose-invert text-white"
                              : ""
                          }`}
                        >
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc ml-4 mb-2">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal ml-4 mb-2">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (!isStreaming) {
                                      setPendingUrl(href || "");
                                      setShowExternalDialog(true);
                                    }
                                  }}
                                  className="text-blue-500 hover:underline"
                                >
                                  {children}{" "}
                                  <ExternalLink className="inline h-3 w-3" />
                                </a>
                              ),
                              code: ({ children }) => (
                                <code className="bg-muted-foreground/20 rounded px-1 py-0.5 text-xs">
                                  {children}
                                </code>
                              ),
                              pre: ({ children }) => (
                                <pre className=" rounded p-2 overflow-x-auto my-2 text-xs">
                                  {children}
                                </pre>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-auto">
                <form onSubmit={handleSubmit} className="relative mb-4">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask Andy Anything..."
                    className="w-full h-14 pl-5 pr-14"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-3 h-8 w-8 bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                  >
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                </form>

                <div className="flex flex-wrap gap-2 justify-center">
                  {exampleQuestions.map((question, index) => {
                    const getEmoji = (q: string) => {
                      switch (q) {
                        case "What is an OLAS Agent?":
                          return "🤖";
                        case "Give me an example of an OLAS Agent":
                          return "💡";
                        case "Show me a agent that predicts prediction markets":
                          return "🎯";
                        case "How does the trader agent work?":
                          return "📈";
                        case "How do I make my own agent?":
                          return "🛠️";
                        case "Can you tell me how to stake OLAS in the easiest way possible?":
                          return "💰";
                        case "Give me content I can look at to learn more about OLAS":
                          return "📚";
                        default:
                          return "❓";
                      }
                    };

                    return (
                      <Button
                        key={index}
                        variant="outline"
                        onClick={() => handleQuestionClick(question)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {getEmoji(question)} {question}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center space-x-4 mt-8 max-w-3xl mx-auto">
            <Button
              size="lg"
              onClick={() => {
                setPendingUrl("https://docs.autonolas.network/get_started/");
                setShowExternalDialog(true);
              }}
            >
              Launch your agent
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={() => {
                setPendingUrl("https://docs.olas.network");
                setShowExternalDialog(true);
              }}
            >
              Documentation
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </main>
      </motion.div>
      <ExternalLinkDialog />
    </div>
  );
}
