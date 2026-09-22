import { InvalidMessageThreadsInputError, InvalidMessageThreadsResponseError } from "./errors.js";
import type {
  ListMessageThreadsInput,
  ListMessageThreadsResult,
  MessageThreadPagination,
  VintedMessageThread,
  VintedMessageThreadLastMessage
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
