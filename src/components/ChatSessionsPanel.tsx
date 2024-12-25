import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/use-auth";
import { cn } from "../lib/utils";
import type { FC, ButtonHTMLAttributes, ReactNode } from "react";

interface ChatSession {
  id: string;
  session_title: string;
  created_at: string;
}

interface ChatSessionsPanelProps {
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
}

interface SessionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  session?: ChatSession;
  isSelected?: boolean;
  onSelect: (sessionId: string) => void;
  className?: string;
  children?: ReactNode;
}

const SessionButton: FC<SessionButtonProps> = ({ 
  session, 
  isSelected, 
  onSelect, 
  className, 
  children, 
  ...props 
}: SessionButtonProps) => (
  <button
    onClick={() => onSelect(session?.id || "")}
    className={cn(
      "w-full text-left px-4 py-2 rounded-lg transition-colors",
      "hover:bg-gray-100 dark:hover:bg-gray-800",
      isSelected ? "bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-900",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

const ChatSessionsPanel: FC<ChatSessionsPanelProps> = ({ 
  onSelectSession, 
  currentSessionId 
}: ChatSessionsPanelProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const token = await getAccessToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/sessions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [getAccessToken]);

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Recent Chats</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No chat sessions yet</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <SessionButton
                session={session}
                isSelected={currentSessionId === session.id}
                onSelect={onSelectSession}
              >
                <div className="text-sm font-medium">{session.session_title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(session.created_at).toLocaleString()}
                </div>
              </SessionButton>
            </li>
          ))}
        </ul>
      )}
      <SessionButton
        onSelect={() => onSelectSession("")}
        className={cn(
          "text-sm font-medium text-center",
          "border border-gray-300 dark:border-gray-700",
          "hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        Start New Chat
      </SessionButton>
    </div>
  );
};

export default ChatSessionsPanel;
