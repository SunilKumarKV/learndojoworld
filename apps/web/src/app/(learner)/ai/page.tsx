"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AIUsageMeter } from "@/features/ai/ai-usage-meter";
import { useSession } from "@/hooks/use-session";
import { ApiError } from "@/services/api-client";
import {
  AIChatRequest,
  AIConversationDetail,
  AIConversationSummary,
  AIInstruction,
  chatWithAI,
  deleteAIConversation,
  getAIConversation,
  getAIConversations,
} from "@/services/ai.api";
import { AIUsageSummary, getAIUsage } from "@/services/billing.api";

const instructionButtons: Array<{ label: string; value: AIInstruction }> = [
  { label: "Explain Like Beginner", value: "EXPLAIN_SIMPLE" },
  { label: "Give Real Example", value: "REAL_EXAMPLE" },
  { label: "Quiz Me", value: "QUIZ_ME" },
  { label: "Summarize", value: "SUMMARIZE" },
  { label: "Create Flashcards", value: "CREATE_FLASHCARDS" },
];

function AIPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading } = useSession();
  const courseId = params.get("courseId") ?? undefined;
  const courseSlug = params.get("courseSlug") ?? undefined;
  const lessonId = params.get("lessonId") ?? undefined;

  const [conversations, setConversations] = useState<AIConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AIConversationDetail | null>(
    null,
  );
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    undefined,
  );
  const [input, setInput] = useState("");
  const [instruction] = useState<AIInstruction | undefined>(undefined);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageSummary | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  const currentContextLabel = useMemo(() => {
    if (lessonId) return `Conversation for lesson ${lessonId}`;
    if (courseSlug) return `Conversation for course ${courseSlug}`;
    if (courseId) return "Course conversation";
    return "General AI tutor conversation";
  }, [courseSlug, courseId, lessonId]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    void loadConversations();
    void loadUsage();
  }, [user]);

  async function loadUsage() {
    try {
      const response = await getAIUsage();
      setAiUsage(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load AI usage.");
    }
  }

  async function loadConversations() {
    try {
      const response = await getAIConversations();
      setConversations(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load AI conversations.");
    }
  }

  async function selectConversation(conversationId: string) {
    setErrorMessage(null);
    setIsBusy(true);

    try {
      const response = await getAIConversation(conversationId);
      setSelectedConversation(response.data);
      setSelectedConversationId(response.data.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load selected conversation.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSend(instructionOverride?: AIInstruction) {
    const trimmed = input.trim();
    if (!trimmed && !instructionOverride) {
      setErrorMessage("Enter a question or choose an AI action.");
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    const payload: AIChatRequest = {
      conversationId: selectedConversationId,
      courseId,
      lessonId,
      instruction: instructionOverride ?? instruction,
      message: trimmed || "",
    };

    try {
      const response = await chatWithAI(payload);
      setAiUsage(response.data.aiUsage);
      setLastProvider(response.data.provider ?? null);
      setUpgradeRequired(false);

      if (!response.data.conversationId?.trim() || response.data.conversationId === "undefined") {
        throw new Error("AI response did not include a valid conversation id.");
      }

      setSelectedConversation((current) => {
        if (!current) return current;
        return {
          ...current,
          messages: [
            ...current.messages,
            {
              id: `${Date.now()}-user`,
              role: "USER",
              content: payload.message,
              createdAt: new Date().toISOString(),
            },
            response.data.message,
          ],
        };
      });

      if (!selectedConversationId) {
        await loadConversations();
        setSelectedConversationId(response.data.conversationId);
        const conversationResponse = await getAIConversation(response.data.conversationId);
        setSelectedConversation(conversationResponse.data);
      }

      setInput("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        setUpgradeRequired(true);
        await loadUsage();
        setErrorMessage("You have reached your AI tutor limit. Upgrade your plan to continue.");
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "AI tutor request failed. Please try again.",
        );
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDelete(conversationId: string) {
    setErrorMessage(null);
    setIsBusy(true);
    try {
      await deleteAIConversation(conversationId);
      if (selectedConversationId === conversationId) {
        setSelectedConversation(null);
        setSelectedConversationId(undefined);
      }
      await loadConversations();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete the conversation.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">Loading...</main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        Please log in to access the AI tutor.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_0.55fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Tutor</p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-950">LearnDojoWorld Tutor</h1>
              {process.env.NODE_ENV === "development" && lastProvider ? (
                <p className="mt-1 text-xs text-slate-500">Provider: {lastProvider}</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Ask the tutor questions about your course and lesson content, summarize material, or
                create quiz and flashcard prompts.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {instructionButtons.map((item) => (
                  <Button
                    key={item.value}
                    variant="secondary"
                    onClick={() => {
                      void handleSend(item.value);
                    }}
                    disabled={isBusy}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <textarea
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Ask your tutor anything about this course or lesson..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={5}
                disabled={isBusy}
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{currentContextLabel}</p>
                <Button onClick={() => void handleSend()} disabled={isBusy}>
                  Send message
                </Button>
              </div>
              {errorMessage ? (
                <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <p>{errorMessage}</p>
                  {upgradeRequired ? (
                    <Button className="mt-3" onClick={() => router.push("/billing")}>
                      View plans
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Conversation history</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedConversation ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedConversation.title ?? "Untitled conversation"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedConversation.messages.length} messages ·{" "}
                        {selectedConversation.totalTokens} tokens
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => void handleDelete(selectedConversation.id)}
                      disabled={isBusy}
                    >
                      Delete conversation
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {selectedConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`rounded-3xl border px-4 py-3 ${
                          message.role === "ASSISTANT"
                            ? "border-slate-200 bg-slate-50"
                            : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {message.role}
                        </p>
                        <p className="mt-2 whitespace-pre-line text-sm text-slate-900">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Select an existing conversation on the right, or send a message to start a new AI
                  session.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Usage</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">AI quota</h2>
            </CardHeader>
            <CardContent>
              <AIUsageMeter compact usage={aiUsage} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Conversations</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Your tutor history</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversations.length > 0 ? (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    className={`w-full rounded-3xl border p-4 text-left transition hover:border-primary/80 ${
                      conversation.id === selectedConversationId
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 bg-white"
                    }`}
                    onClick={() => void selectConversation(conversation.id)}
                    disabled={isBusy}
                  >
                    <p className="text-sm font-semibold text-slate-900">{conversation.title}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  No AI conversations yet. Start with a message above.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

export default function AIPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">Loading AI tutor...</div>
      }
    >
      <AIPageContent />
    </Suspense>
  );
}
