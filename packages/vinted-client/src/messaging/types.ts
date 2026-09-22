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
