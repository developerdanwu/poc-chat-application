import { type ExpressionBuilder } from 'kysely';
import {
  type Author,
  type Chatroom,
  type DB,
} from '@prisma-generated/generated/types';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

export const TABLE_ALIAS = {
  chatroom: 'c',
  author: 'au',
  authors_on_chatrooms: 'ac',
} as const;

export const withAuthors = (
  eb: ExpressionBuilder<DB & { [TABLE_ALIAS.chatroom]: Chatroom }, 'c'>
) => {
  return jsonArrayFrom(
    eb
      .selectFrom(`author as ${TABLE_ALIAS.author}`)
      .innerJoin(
        `_authors_on_chatrooms as ${TABLE_ALIAS.authors_on_chatrooms}`,
        `${TABLE_ALIAS.authors_on_chatrooms}.author_id`,
        `${TABLE_ALIAS.author}.author_id`
      )
      .select([
        `${TABLE_ALIAS.author}.first_name`,
        `${TABLE_ALIAS.author}.last_name`,
        `${TABLE_ALIAS.author}.user_id`,
        `${TABLE_ALIAS.author}.author_id`,
        `${TABLE_ALIAS.author}.role`,
        `${TABLE_ALIAS.author}.created_at`,
        `${TABLE_ALIAS.author}.updated_at`,
      ])
      .whereRef(
        `${TABLE_ALIAS.authors_on_chatrooms}.chatroom_id`,
        '=',
        `${TABLE_ALIAS.chatroom}.id`
      )
  ).as('authors');
};

export const withChatrooms = (
  eb: ExpressionBuilder<DB & { au: Author }, 'au'>
) => {
  return jsonArrayFrom(
    eb
      .selectFrom(`chatroom as ${TABLE_ALIAS.chatroom}`)
      .innerJoin(
        `_authors_on_chatrooms as ${TABLE_ALIAS.authors_on_chatrooms}`,
        `${TABLE_ALIAS.authors_on_chatrooms}.chatroom_id`,
        `${TABLE_ALIAS.chatroom}.id`
      )
      .select((eb) => [
        `${TABLE_ALIAS.chatroom}.id`,
        `${TABLE_ALIAS.chatroom}.status`,
        `${TABLE_ALIAS.chatroom}.type`,
        `${TABLE_ALIAS.chatroom}.created_at`,
        `${TABLE_ALIAS.chatroom}.updated_at`,
        withAuthors(eb),
      ])
      .whereRef(
        `${TABLE_ALIAS.authors_on_chatrooms}.author_id`,
        '=',
        `${TABLE_ALIAS.author}.author_id`
      )
  ).as('chatrooms');
};
