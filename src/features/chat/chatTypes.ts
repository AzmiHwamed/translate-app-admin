export type SenderRole = "user" | "admin";

export interface Conversation {
  id: string;
  userId: string;
  userDisplayName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null; // ISO string from SQL, epoch ms when it arrives via RTDB
  unreadByAdmin: number;
  unreadByUser: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: SenderRole;
  body: string;
  isRead: boolean;
  createdAt: string; // ISO string from SQL, epoch ms when it arrives via RTDB
}
// chatTypes.ts — add this
export interface FetchMessagesResult {
  conversationId: string;
  messages: Message[];
}
// Raw shape mirrored into Firebase Realtime Database (see backend ChatRealtimeService)
export interface RealtimeConversation {
  userId: string;
  userDisplayName: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: number | null;
  unreadByAdmin: number;
  unreadByUser: number;
  updatedAt: number;
}

export interface RealtimeMessage {
  senderId: string;
  senderRole: SenderRole;
  body: string;
  isRead: boolean;
  createdAt: number;
}
