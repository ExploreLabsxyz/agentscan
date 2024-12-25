/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, ExternalLink, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AnimatedRobot from "./AnimatedRobot";
import { toast } from "@/hooks/use-toast";
import ChatHistoryPanel from "./ChatHistoryPanel";
import { Message } from "@/types";

interface ChatComponentProps {
  onSend?: (message: string) => Promise<void>;
  initialMessage?: string;
  messages?: Message[];
  placeholder?: string;
  onExternalLinkClick?: (url: string) => void;
  children?: React.ReactNode;
  exampleQuestions?: string[];
  showHistory?: boolean;
  onSelectChat?: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatComponent({
  onSend,
  initialMessage = "Hi there",
  messages: propMessages = [],
  placeholder = "Send a message to this agent...",
  onExternalLinkClick,
  exampleQuestions = [],
  showHistory = false,
  onSelectChat,
  selectedChatId,
}: ChatComponentProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [showExampleQuestions, setShowExampleQuestions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const messages = useMemo(() => {
    const initialMessageObj = {
      role: "assistant" as const,
      content: initialMessage,
    };

    return [initialMessageObj, ...propMessages];
  }, [propMessages, initialMessage]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
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

    setTimeout(() => {
      container.scrollTop = container.scrollHeight;
    }, 100);
  }, [messages, userScrolled]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;

    try {
      setIsLoading(true);
      if (onSend) {
        await onSend(currentMessage);
        setMessage("");
      }
    } catch {
      toast({
        title: "Error sending message",
        description: "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        e.preventDefault();
        setMessage((prev) => prev + "\n");
      } else {
        handleSubmit(e);
      }
    }
  };

  const handleQuestionClick = async (question: string) => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      if (onSend) {
        await onSend(question);
      }
    } catch {
      toast({
        title: "Error sending message",
        description: "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback((element?: HTMLTextAreaElement | null) => {
    const textarea = element || textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 400)}px`;

      if (textarea.scrollHeight > 400) {
        requestAnimationFrame(() => {
          textarea.scrollTop = textarea.scrollHeight;
        });
      }
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  return (
    <div className="flex h-full">
      {showHistory && onSelectChat && (
        <ChatHistoryPanel
          onSelectChat={onSelectChat}
          selectedChatId={selectedChatId}
        />
      )}
      <div className="flex-1 flex flex-col">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-2 pb-2 min-h-0"
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
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-purple-100">
                    <AnimatedRobot scale={0.2} />
                  </AvatarFallback>
                </Avatar>
              )}
              <motion.div
                initial="initial"
                animate="animate"
                variants={{
                  initial: { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`rounded-2xl px-4 py-2 shadow-sm break-words ${
                  message.role === "user"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === "user" ? "prose-invert text-white" : ""
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="mb-0 text-[15px]">{children}</p>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onExternalLinkClick && href) {
                              onExternalLinkClick(href);
                            }
                          }}
                          className="text-blue-500 hover:underline"
                        >
                          {children} <ExternalLink className="inline h-3 w-4" />
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="bg-muted-foreground/20 rounded px-1 py-0.5 text-xs">
                          {children}
                        </code>
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
        {isLoading && (
          <div className="flex mb-4 py-4 justify-start">
            <div className="flex items-start gap-3 max-w-[80%]">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-purple-100">
                  <AnimatedRobot scale={0.2} />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-2">
        {exampleQuestions.length > 0 && (
          <div className="flex flex-col gap-2 mb-2">
            <button
              onClick={() => setShowExampleQuestions(!showExampleQuestions)}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2"
            >
              {showExampleQuestions ? "Hide examples" : "Show examples"}
              {showExampleQuestions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showExampleQuestions && (
              <div className="flex flex-wrap gap-2 justify-center">
                {(isMobile
                  ? exampleQuestions.slice(0, 3)
                  : exampleQuestions
                ).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleQuestionClick(question)}
                    className="text-gray-600 hover:text-gray-800 text-sm py-1 px-4 whitespace-normal text-left"
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[56px] max-h-[400px] pl-4 pr-12 py-4 text-sm rounded-2xl border border-gray-200 resize-none"
            disabled={isLoading}
            rows={1}
            style={{
              lineHeight: "1.5",
              overflowY: "auto",
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-3 h-8 w-8 bg-purple-600 hover:bg-purple-700 text-white rounded-full"
            disabled={isLoading || !message.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 mt-4">
                No messages yet. Start a conversation!
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex items-center gap-2">
              <textarea
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setMessage(e.target.value);
                  adjustTextareaHeight(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 resize-none overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[2.5rem] max-h-[10rem]"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !message.trim()}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
