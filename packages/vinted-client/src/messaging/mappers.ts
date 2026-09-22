import {
  InvalidConversationInputError,
  InvalidConversationResponseError,
  InvalidSendMessageInputError,
  InvalidSentMessageResponseError,
  InvalidMessageThreadsInputError,
  InvalidMessageThreadsResponseError
} from "./errors.js";
import type {
  ListMessageThreadsInput,
  ListMessageThreadsResult,
  MessagePagination,
  MessageThreadPagination,
  SendMessageInput,
  SendMessagePayload,
  VintedConversation,
  VintedMessage,
  VintedMessageThread,
  VintedMessageThreadLastMessage,
  VintedSentMessage
} from "./types.js";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalStringOrNumber(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function requiredStringOrNumber(value: unknown, error: Error): string | number {
  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  throw error;
}

export function buildMessageThreadsQuery(input: ListMessageThreadsInput = {}): Record<string, string> {
  const query: Record<string, string> = {};

  if (input.nextCursor !== undefined) {
    if (input.nextCursor.length === 0) {
      throw new InvalidMessageThreadsInputError("nextCursor must not be empty");
    }
    query.next_cursor = input.nextCursor;
  }

  return query;
}

function mapLastMessage(value: unknown): VintedMessageThreadLastMessage | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const lastMessage: VintedMessageThreadLastMessage = {};
  const id = optionalStringOrNumber(value.id);
  const conversationId = optionalStringOrNumber(value.conversation_id);
  const senderId = optionalStringOrNumber(value.sender_id);
  const messageType = optionalString(value.message_type);
  const createdAt = optionalString(value.created_at);

  if (id !== undefined) {
    lastMessage.id = id;
  }
  if (conversationId !== undefined) {
    lastMessage.conversationId = conversationId;
  }
  if (senderId !== undefined) {
    lastMessage.senderId = senderId;
  }
  if (messageType !== undefined) {
    lastMessage.messageType = messageType;
  }
  if (createdAt !== undefined) {
    lastMessage.createdAt = createdAt;
  }

  return Object.keys(lastMessage).length === 0 ? undefined : lastMessage;
}

function mapOppositeUsers(value: unknown): VintedMessageThread["oppositeUsers"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter(isRecord).map((user) => {
    const mapped: NonNullable<VintedMessageThread["oppositeUsers"]>[number] = {};
    const type = optionalString(user.type);
    if (type !== undefined) {
      mapped.type = type;
    }
    return mapped;
  });
}

export function mapMessageThread(value: unknown): VintedMessageThread {
  if (!isRecord(value)) {
    throw new InvalidMessageThreadsResponseError("Message thread is not an object");
  }

  const id = optionalStringOrNumber(value.id);
  if (id === undefined) {
    throw new InvalidMessageThreadsResponseError("Message thread is missing an id");
  }

  const thread: VintedMessageThread = { id };
  const conversationType = optionalString(value.conversation_type);
  const createdAt = optionalString(value.created_at);
  const isDeletable = optionalBoolean(value.is_deletable);
  const isUnreadByCurrentUser = optionalBoolean(value.is_unread_by_current_user);
  const lastMessage = mapLastMessage(value.last_message);
  const oppositeUsers = mapOppositeUsers(value.opposite_users);

  if (conversationType !== undefined) {
    thread.conversationType = conversationType;
  }
  if (createdAt !== undefined) {
    thread.createdAt = createdAt;
  }
  if (isDeletable !== undefined) {
    thread.isDeletable = isDeletable;
  }
  if (isUnreadByCurrentUser !== undefined) {
    thread.isUnreadByCurrentUser = isUnreadByCurrentUser;
  }
  if (lastMessage !== undefined) {
    thread.lastMessage = lastMessage;
  }
  if (oppositeUsers !== undefined) {
    thread.oppositeUsers = oppositeUsers;
  }

  return thread;
}

function mapPagination(value: unknown): MessageThreadPagination | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const pagination: MessageThreadPagination = {};
  const hasNext = optionalBoolean(value.has_next);
  const hasPrev = optionalBoolean(value.has_prev);
  const nextCursor = optionalString(value.next_cursor);
  const prevCursor = optionalString(value.prev_cursor);

  if (hasNext !== undefined) {
    pagination.hasNext = hasNext;
  }
  if (hasPrev !== undefined) {
    pagination.hasPrev = hasPrev;
  }
  if (nextCursor !== undefined) {
    pagination.nextCursor = nextCursor;
  }
  if (prevCursor !== undefined) {
    pagination.prevCursor = prevCursor;
  }

  return Object.keys(pagination).length === 0 ? undefined : pagination;
}

export function mapMessageThreadsResponse(value: unknown): ListMessageThreadsResult {
  if (!isRecord(value)) {
    throw new InvalidMessageThreadsResponseError("Message threads response is not an object");
  }

  if (!Array.isArray(value.conversations)) {
    throw new InvalidMessageThreadsResponseError("Message threads response is missing conversations array");
  }

  const result: ListMessageThreadsResult = {
    threads: value.conversations.map((thread) => mapMessageThread(thread))
  };

  const pagination = mapPagination(value.pagination);
  if (pagination !== undefined) {
    result.pagination = pagination;
  }

  return result;
}

export function buildConversationPath(conversationId: string | number): string {
  if (conversationId === "" || conversationId === null || conversationId === undefined) {
    throw new InvalidConversationInputError("conversationId is required");
  }

  if (typeof conversationId === "number" && !Number.isFinite(conversationId)) {
    throw new InvalidConversationInputError("conversationId must be finite");
  }

  return `/messaging/main/conversations/${encodeURIComponent(String(conversationId))}`;
}

export function buildSendMessagePath(conversationId: string | number): string {
  try {
    return `${buildConversationPath(conversationId)}/replies`;
  } catch (error) {
    if (error instanceof InvalidConversationInputError) {
      throw new InvalidSendMessageInputError(error.message);
    }
    throw error;
  }
}

export function buildSendMessagePayload(input: SendMessageInput): SendMessagePayload {
  if (input.content.length === 0 || input.content.trim().length === 0) {
    throw new InvalidSendMessageInputError("content must not be blank");
  }

  buildSendMessagePath(input.conversationId);

  return {
    content: input.content,
    is_personal_data_sharing_check_skipped: false,
    photo_temp_uuids: null
  };
}

function mapMessageText(rawMessage: UnknownRecord): string | undefined {
  if (rawMessage.message_type !== "text" || !isRecord(rawMessage.data)) {
    return undefined;
  }

  return optionalString(rawMessage.data.body);
}

export function mapConversationMessage(value: unknown): VintedMessage {
  if (!isRecord(value)) {
    throw new InvalidConversationResponseError("Conversation message is not an object");
  }

  const id = requiredStringOrNumber(
    value.id,
    new InvalidConversationResponseError("Conversation message is missing an id")
  );
  const message: VintedMessage = { id };
  const conversationId = typeof value.conversation_id === "string" || typeof value.conversation_id === "number"
    ? value.conversation_id
    : undefined;
  const senderId = typeof value.sender_id === "string" || typeof value.sender_id === "number" ? value.sender_id : undefined;
  const messageType = optionalString(value.message_type);
  const createdAt = optionalString(value.created_at);
  const text = mapMessageText(value);

  if (conversationId !== undefined) {
    message.conversationId = conversationId;
  }
  if (senderId !== undefined) {
    message.senderId = senderId;
  }
  if (messageType !== undefined) {
    message.messageType = messageType;
  }
  if (createdAt !== undefined) {
    message.createdAt = createdAt;
  }
  if (text !== undefined) {
    message.text = text;
  }

  return message;
}

function mapMessagePagination(value: unknown): MessagePagination | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const pagination: MessagePagination = {};
  const hasNext = optionalBoolean(value.has_next);
  const hasPrev = optionalBoolean(value.has_prev);
  const nextCursor = optionalString(value.next_cursor);
  const prevCursor = optionalString(value.prev_cursor);

  if (hasNext !== undefined) {
    pagination.hasNext = hasNext;
  }
  if (hasPrev !== undefined) {
    pagination.hasPrev = hasPrev;
  }
  if (nextCursor !== undefined) {
    pagination.nextCursor = nextCursor;
  }
  if (prevCursor !== undefined) {
    pagination.prevCursor = prevCursor;
  }

  return Object.keys(pagination).length === 0 ? undefined : pagination;
}

export function mapConversationResponse(value: unknown): VintedConversation {
  if (!isRecord(value)) {
    throw new InvalidConversationResponseError("Conversation response is not an object");
  }

  const id = requiredStringOrNumber(value.id, new InvalidConversationResponseError("Conversation is missing an id"));
  if (!Array.isArray(value.messages)) {
    throw new InvalidConversationResponseError("Conversation response is missing messages array");
  }

  const conversation: VintedConversation = {
    id,
    messages: value.messages.map((message) => mapConversationMessage(message))
  };
  const allowReply = optionalBoolean(value.allow_reply);
  const conversationType = optionalString(value.conversation_type);
  const createdAt = optionalString(value.created_at);
  const isUnreadByCurrentUser = optionalBoolean(value.is_unread_by_current_user);
  const pagination = mapMessagePagination(value.pagination);

  if (allowReply !== undefined) {
    conversation.allowReply = allowReply;
  }
  if (conversationType !== undefined) {
    conversation.conversationType = conversationType;
  }
  if (createdAt !== undefined) {
    conversation.createdAt = createdAt;
  }
  if (isUnreadByCurrentUser !== undefined) {
    conversation.isUnreadByCurrentUser = isUnreadByCurrentUser;
  }
  if (pagination !== undefined) {
    conversation.pagination = pagination;
  }

  return conversation;
}

export function mapSentMessageResponse(value: unknown): VintedSentMessage {
  if (!isRecord(value)) {
    throw new InvalidSentMessageResponseError("Sent message response is not an object");
  }

  const id = requiredStringOrNumber(value.id, new InvalidSentMessageResponseError("Sent message is missing an id"));
  const message: VintedSentMessage = { id };
  const conversationId = typeof value.conversation_id === "string" || typeof value.conversation_id === "number"
    ? value.conversation_id
    : undefined;
  const senderId = typeof value.sender_id === "string" || typeof value.sender_id === "number" ? value.sender_id : undefined;
  const createdAt = optionalString(value.created_at);
  const messageType = optionalString(value.message_type);
  const text = isRecord(value.data) ? optionalString(value.data.content) : undefined;

  if (conversationId !== undefined) {
    message.conversationId = conversationId;
  }
  if (senderId !== undefined) {
    message.senderId = senderId;
  }
  if (createdAt !== undefined) {
    message.createdAt = createdAt;
  }
  if (messageType !== undefined) {
    message.messageType = messageType;
  }
  if (text !== undefined) {
    message.text = text;
  }

  return message;
}
