import { type ExpressionBuilder } from 'kysely';
import {
  type Author,
  type Chatroom,
  type DB,
} from '@prisma-generated/generated/types';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

const TABLE_ALIAS = {
  chatroom: 'c',
  author: 'au',
  _authors_on_chatrooms: 'ac',
} as const;

const SELECT_FIELDS = {
  author: [
    `${TABLE_ALIAS.author}.author_id`,
    `${TABLE_ALIAS.author}.user_id`,
    `${TABLE_ALIAS.author}.first_name`,
    `${TABLE_ALIAS.author}.last_name`,
    `${TABLE_ALIAS.author}.role`,
    `${TABLE_ALIAS.author}.email`,
    `${TABLE_ALIAS.author}.created_at`,
    `${TABLE_ALIAS.author}.updated_at`,
  ],
  chatroom: [
    `${TABLE_ALIAS.chatroom}.id`,
    `${TABLE_ALIAS.chatroom}.status`,
    `${TABLE_ALIAS.chatroom}.type`,
    `${TABLE_ALIAS.chatroom}.created_at`,
    `${TABLE_ALIAS.chatroom}.updated_at`,
  ],
} as const;

export const dbConfig = {
  tableAlias: TABLE_ALIAS,
  selectFields: SELECT_FIELDS,
} as const;

export const withAuthors = (
  eb: ExpressionBuilder<DB & { [dbConfig.tableAlias.chatroom]: Chatroom }, 'c'>
) => {
  return jsonArrayFrom(
    eb
      .selectFrom(`author as ${dbConfig.tableAlias.author}`)
      .innerJoin(
        `_authors_on_chatrooms as ${dbConfig.tableAlias._authors_on_chatrooms}`,
        `${dbConfig.tableAlias._authors_on_chatrooms}.author_id`,
        `${dbConfig.tableAlias.author}.author_id`
      )
      .select([...dbConfig.selectFields.author])
      .whereRef(
        `${dbConfig.tableAlias._authors_on_chatrooms}.chatroom_id`,
        '=',
        `${dbConfig.tableAlias.chatroom}.id`
      )
  ).as('authors');
};

export const withChatrooms = (
  eb: ExpressionBuilder<DB & { [dbConfig.tableAlias.author]: Author }, 'au'>
) => {
  return jsonArrayFrom(
    eb
      .selectFrom(`chatroom as ${dbConfig.tableAlias.chatroom}`)
      .innerJoin(
        `_authors_on_chatrooms as ${dbConfig.tableAlias._authors_on_chatrooms}`,
        `${dbConfig.tableAlias._authors_on_chatrooms}.chatroom_id`,
        `${dbConfig.tableAlias.chatroom}.id`
      )
      .select((eb) => [...dbConfig.selectFields.chatroom, withAuthors(eb)])
      .whereRef(
        `${dbConfig.tableAlias._authors_on_chatrooms}.author_id`,
        '=',
        `${dbConfig.tableAlias.author}.author_id`
      )
  ).as('chatrooms');
};
