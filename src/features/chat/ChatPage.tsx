import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  markConversationRead,
  setActiveConversation,
  conversationUpsertedFromRealtime,
  messageReceivedFromRealtime,
} from "./chatSlice";
import { ref, onValue, type Unsubscribe } from "firebase/database";
import { database } from "../../lib/firebaseClient";
import type { RealtimeConversation, RealtimeMessage } from "./chatTypes";

export function ChatPage() {
  const dispatch = useAppDispatch();
  const { conversations, messagesByConversation, activeConversationId, conversationsStatus, sendStatus } =
    useAppSelector((state) => state.chat);

  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  // Live conversation list — merges new messages / unread counts as they land
  useEffect(() => {
    const unsubscribe: Unsubscribe = onValue(ref(database, "chats/conversations"), (snapshot) => {
      const value = snapshot.val() as Record<string, RealtimeConversation> | null;
      if (!value) return;
      for (const [id, data] of Object.entries(value)) {
        dispatch(conversationUpsertedFromRealtime({ id, data }));
      }
    });
    return () => unsubscribe();
  }, [dispatch]);

  // Live messages for whichever thread is open
  useEffect(() => {
    if (!activeConversationId) return;
    const unsubscribe: Unsubscribe = onValue(ref(database, `chats/messages/${activeConversationId}`), (snapshot) => {
      const value = snapshot.val() as Record<string, RealtimeMessage> | null;
      if (!value) return;
      for (const [id, data] of Object.entries(value)) {
        dispatch(messageReceivedFromRealtime({ conversationId: activeConversationId, id, data }));
      }
    });
    return () => unsubscribe();
  }, [dispatch, activeConversationId]);

  const sortedConversations = useMemo(
    () =>
      [...conversations]
        .filter((c) => (c.userDisplayName ?? c.userId).toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime()),
    [conversations, search],
  );

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? (messagesByConversation[activeConversationId] ?? []) : [];

  const isLoading = conversationsStatus === "loading" && conversations.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  function openConversation(id: string) {
    dispatch(setActiveConversation(id));
    if (!messagesByConversation[id]) {
      dispatch(fetchMessages(id));
    }
    dispatch(markConversationRead(id));
  }

  function handleSend() {
    if (!activeConversationId || !draft.trim()) return;
    dispatch(sendMessage({ conversationId: activeConversationId, body: draft.trim() }));
    setDraft("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={{ height: "calc(100vh - 120px)" }}>
      {/* Conversation list */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/5 lg:col-span-1">
        <div className="border-b border-gray-100 p-5">
          <h2 className="m-0 text-sm font-semibold text-gray-900">Conversations</h2>
          <p className="m-0 mt-0.5 text-xs text-gray-400">Support chats with your users</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-accent"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-400">
              No conversations yet.
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {sortedConversations.map((c) => {
                const isActive = c.id === activeConversationId;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => openConversation(c.id)}
                      className={`flex w-full items-start gap-3 border-b border-gray-50 px-5 py-3 text-left transition-colors ${
                        isActive ? "bg-accent-soft" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        {(c.userDisplayName ?? c.userId).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-gray-900">
                            {c.userDisplayName ?? "Unknown user"}
                          </span>
                          {c.unreadByAdmin > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-black">
                              {c.unreadByAdmin}
                            </span>
                          )}
                        </div>
                        <p className="m-0 mt-0.5 truncate text-xs text-gray-400">
                          {c.lastMessagePreview ?? "No messages yet"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/5 lg:col-span-2">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <span className="text-sm font-medium text-gray-500">Select a conversation</span>
            <span className="text-xs text-gray-400">Pick someone from the list to see the thread.</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                {(activeConversation.userDisplayName ?? activeConversation.userId).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="m-0 text-sm font-semibold text-gray-900">
                  {activeConversation.userDisplayName ?? "Unknown user"}
                </p>
                <p className="m-0 text-xs text-gray-400">{activeConversation.userId}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {activeMessages.map((m) => (
                <div key={m.id} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                      m.senderRole === "admin" ? "bg-accent text-black" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {m.body}
                    <div
                      className={`mt-1 text-[10px] ${m.senderRole === "admin" ? "text-black/70" : "text-gray-400"}`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 p-4">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder="Type a reply…"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 outline-none focus:border-accent"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim() || sendStatus === "loading"}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
