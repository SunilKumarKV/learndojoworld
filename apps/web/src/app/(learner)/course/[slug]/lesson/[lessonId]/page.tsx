"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { getLessonById, type LessonDetail } from "@/services/learning.api";
import {
  AIChatRequest,
  AIConversationSummary,
  AIInstruction,
  chatWithAI,
  getAIConversations,
  getAIConversation,
} from "@/services/ai.api";

const instructionButtons: Array<{ label: string; value: AIInstruction }> = [
  { label: "Explain Like Beginner", value: "EXPLAIN_SIMPLE" },
  { label: "Give Real Example", value: "REAL_EXAMPLE" },
  { label: "Quiz Me", value: "QUIZ_ME" },
  { label: "Summarize", value: "SUMMARIZE" },
  { label: "Create Flashcards", value: "CREATE_FLASHCARDS" },
];

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.lessonId as string | undefined;
  const { user, isLoading } = useSession();

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string }>>(
    [],
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    undefined,
  );
  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [instruction] = useState<AIInstruction | undefined>(undefined);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = lesson?.title ?? "Lesson";

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!lessonId || !user) return;

    void loadLesson();
    void loadConversations();
  }, [lessonId, user]);

  const contextLabel = useMemo(() => {
    if (!lesson) return "Lesson AI tutor";
    return `${lesson.course.title} · ${lesson.title}`;
  }, [lesson]);

  async function loadLesson() {
    if (!lessonId) return;

    setLoading(true);
    try {
      const response = await getLessonById(lessonId);
      setLesson(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load lesson.");
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations() {
    try {
      const response = await getAIConversations();
      setConversations(response.data.filter((conversation) => conversation.lessonId === lessonId));
    } catch {
      // No-op
    }
  }

  async function selectConversation(conversationId: string) {
    setLoading(true);
    try {
      const response = await getAIConversation(conversationId);
      setSelectedConversationId(response.data.id);
      setMessages(
        response.data.messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load conversation.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(instructionOverride?: AIInstruction) {
    if (!lesson) return;
    if (!input.trim() && !instructionOverride) {
      setError("Enter a message or choose an AI action.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload: AIChatRequest = {
      conversationId: selectedConversationId,
      courseId: lesson.course.id,
      lessonId: lesson.id,
      instruction: instructionOverride ?? instruction,
      message: input.trim(),
    };

    try {
      const response = await chatWithAI(payload);
      if (!response.data.conversationId?.trim() || response.data.conversationId === "undefined") {
        throw new Error("AI response did not include a valid conversation id.");
      }

      setSelectedConversationId(response.data.conversationId);
      setMessages((current) => [
        ...current,
        { id: `user-${Date.now()}`, role: "USER", content: payload.message },
        {
          id: response.data.message.id ?? `assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: response.data.message.content,
        },
      ]);
      setInput("");
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !lesson) {
    return <div className="min-h-screen bg-slate-50 p-10">Loading lesson…</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lesson player</p>
                <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
                {lesson ? <p className="text-sm text-slate-600">{lesson.course.title}</p> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {error ? (
                <p className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
              ) : null}
              {lesson ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-slate-700">
                    <p className="font-semibold text-slate-900">Lesson content</p>
                    <p className="mt-4 whitespace-pre-line">{lesson.content}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-sm text-slate-600">Lesson metadata</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <span className="rounded-2xl bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {lesson.type}
                      </span>
                      <span className="rounded-2xl bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        Duration: {lesson.durationSec ?? 0} sec
                      </span>
                      <span className="rounded-2xl bg-white px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                        {lesson.isPreview ? "Preview" : "Full lesson"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">Lesson details will appear here.</p>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Tutor</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Lesson coach</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Use AI actions to get help relevant to this lesson and course.
              </p>
              <div className="grid gap-3">
                {instructionButtons.map((item) => (
                  <Button
                    key={item.value}
                    variant={instruction === item.value ? "primary" : "secondary"}
                    onClick={() => void sendMessage(item.value)}
                    disabled={loading}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <textarea
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Type your own question for the AI tutor..."
                value={input}
                rows={5}
                onChange={(event) => setInput(event.target.value)}
                disabled={loading}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">{contextLabel}</p>
                <Button onClick={() => void sendMessage()} disabled={loading}>
                  Ask tutor
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Conversation</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-3xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {message.role}
                      </p>
                      <p className="mt-2 text-sm text-slate-900 whitespace-pre-line">
                        {message.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-600">
                    No AI conversation yet. Send a prompt to start.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Recent AI sessions</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-primary/80"
                    onClick={() => void selectConversation(conversation.id)}
                  >
                    <p className="text-sm font-semibold text-slate-900">{conversation.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  You have no previous AI conversations for this lesson yet.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
