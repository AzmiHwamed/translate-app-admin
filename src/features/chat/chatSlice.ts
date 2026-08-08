import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../../lib/apiClient";
import type { Conversation, FetchMessagesResult, Message, RealtimeConversation, RealtimeMessage } from "./chatTypes";
import type { ApiResponse } from "../common/ApiResponse";

interface ChatState {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string | null;
  conversationsStatus: "idle" | "loading" | "succeeded" | "failed";
  messagesStatus: "idle" | "loading" | "succeeded" | "failed";
  sendStatus: "idle" | "loading" | "failed";
  error: string | null;
}

const initialState: ChatState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  conversationsStatus: "idle",
  messagesStatus: "idle",
  sendStatus: "idle",
  error: null,
};

// Admin inbox — GET /chat/conversations
export const fetchConversations = createAsyncThunk<Conversation[], void, { rejectValue: string }>(
  "chat/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<Conversation[]>>("/chat/conversations");
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load conversations");
    }
  },
);

export const fetchMessages = createAsyncThunk<FetchMessagesResult, string, { rejectValue: string }>(
  "chat/fetchMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<ApiResponse<Message[]>>(`/chat/conversations/${conversationId}/messages`);
      return { conversationId, messages: data.data };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to load messages");
    }
  },
);

interface SendMessageArgs {
  conversationId: string;
  body: string;
}

export const sendMessage = createAsyncThunk<Message, SendMessageArgs, { rejectValue: string }>(
  "chat/sendMessage",
  async ({ conversationId, body }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<ApiResponse<Message>>(`/chat/conversations/${conversationId}/messages`, {
        body,
      });
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.body ?? "Failed to send message");
    }
  },
);

export const markConversationRead = createAsyncThunk<string, string>("chat/markRead", async (conversationId) => {
  await apiClient.patch<ApiResponse<null>>(`/chat/conversations/${conversationId}/read`);
  return conversationId;
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },

    // Fired by the Firebase Realtime Database listener in ChatPage — merges a
    // live conversation update (new message preview, unread counts, etc.)
    conversationUpsertedFromRealtime(state, action: PayloadAction<{ id: string; data: RealtimeConversation }>) {
      const { id, data } = action.payload;
      const existing = state.conversations.find((c) => c.id === id);
      const lastMessageAt = data.lastMessageAt ? new Date(data.lastMessageAt).toISOString() : null;

      if (existing) {
        existing.userDisplayName = data.userDisplayName;
        existing.lastMessagePreview = data.lastMessagePreview;
        existing.lastMessageAt = lastMessageAt;
        existing.unreadByAdmin = data.unreadByAdmin;
        existing.unreadByUser = data.unreadByUser;
      } else {
        state.conversations.push({
          id,
          userId: data.userId,
          userDisplayName: data.userDisplayName,
          lastMessagePreview: data.lastMessagePreview,
          lastMessageAt,
          unreadByAdmin: data.unreadByAdmin,
          unreadByUser: data.unreadByUser,
          createdAt: lastMessageAt ?? new Date().toISOString(),
          updatedAt: lastMessageAt ?? new Date().toISOString(),
        });
      }
    },

    // Fired by the Firebase Realtime Database listener for the open thread
    messageReceivedFromRealtime(
      state,
      action: PayloadAction<{ conversationId: string; id: string; data: RealtimeMessage }>,
    ) {
      const { conversationId, id, data } = action.payload;
      const list = state.messagesByConversation[conversationId] ?? [];

      if (list.some((m) => m.id === id)) return; // already have it (e.g. from our own REST response)

      list.push({
        id,
        conversationId,
        senderId: data.senderId,
        senderRole: data.senderRole,
        body: data.body,
        isRead: data.isRead,
        createdAt: new Date(data.createdAt).toISOString(),
      });
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      state.messagesByConversation[conversationId] = list;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.conversationsStatus = "succeeded";
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsStatus = "failed";
        state.error = action.payload ?? "Failed to load conversations";
      })

      .addCase(fetchMessages.pending, (state) => {
        state.messagesStatus = "loading";
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesStatus = "succeeded";
        state.messagesByConversation[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.messagesStatus = "failed";
        state.error = action.payload ?? "Failed to load messages";
      })

      .addCase(sendMessage.pending, (state) => {
        state.sendStatus = "loading";
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.sendStatus = "idle";
        const list = state.messagesByConversation[action.payload.conversationId] ?? [];
        if (!list.some((m) => m.id === action.payload.id)) {
          list.push(action.payload);
          state.messagesByConversation[action.payload.conversationId] = list;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendStatus = "failed";
        state.error = action.payload ?? "Failed to send message";
      })

      .addCase(markConversationRead.fulfilled, (state, action: PayloadAction<string>) => {
        const conversation = state.conversations.find((c) => c.id === action.payload);
        if (conversation) conversation.unreadByAdmin = 0;
      });
  },
});

export const { setActiveConversation, conversationUpsertedFromRealtime, messageReceivedFromRealtime } =
  chatSlice.actions;
export default chatSlice.reducer;