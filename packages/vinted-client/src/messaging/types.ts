export interface ListMessageThreadsInput {
  nextCursor?: string;
}

export interface MessageThreadPagination {
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface VintedMessageThreadLastMessage {
  id?: string;
  conversationId?: string;
  senderId?: string;
  messageType?: string;
  createdAt?: string;
}

export interface VintedMessageThreadOppositeUser {
  type?: string;
}

export interface VintedMessageThread {
  id: string;
  conversationType?: string;
  createdAt?: string;
  isDeletable?: boolean;
  isUnreadByCurrentUser?: boolean;
  lastMessage?: VintedMessageThreadLastMessage;
  oppositeUsers?: readonly VintedMessageThreadOppositeUser[];
}

export interface ListMessageThreadsResult {
  threads: readonly VintedMessageThread[];
  pagination?: MessageThreadPagination;
}

export interface MessagePagination {
  hasNext?: boolean;
  hasPrev?: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface VintedMessage {
  id: string | number;
  conversationId?: string | number;
  senderId?: string | number;
  messageType?: string;
  createdAt?: string;
  text?: string;
}

export interface VintedConversation {
  id: string | number;
  allowReply?: boolean;
  conversationType?: string;
  createdAt?: string;
  isUnreadByCurrentUser?: boolean;
  messages: readonly VintedMessage[];
  pagination?: MessagePagination;
}

export interface SendMessageInput {
  conversationId: string | number;
  content: string;
}

export interface SendMessagePayload {
  content: string;
  is_personal_data_sharing_check_skipped: false;
  photo_temp_uuids: null;
}

export interface VintedSentMessage {
  id: string | number;
  conversationId?: string | number;
  senderId?: string | number;
  createdAt?: string;
  messageType?: string;
  text?: string;
}
