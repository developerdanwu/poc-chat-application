import type { AliasableExpression, ColumnDataType, Expression } from 'kysely';
import { type ExpressionBuilder, sql } from 'kysely';
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
  message: 'm',
  message_recepient: 'mr',
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
  message: [
    `${TABLE_ALIAS.message}.message_checksum`,
    `${TABLE_ALIAS.message}.client_message_id`,
    `${TABLE_ALIAS.message}.text`,
    `${TABLE_ALIAS.message}.content`,
    `${TABLE_ALIAS.message}.is_edited`,
    `${TABLE_ALIAS.message}.created_at`,
    `${TABLE_ALIAS.message}.updated_at`,
  ],
} as const;

export const dbConfig = {
  tableAlias: TABLE_ALIAS,
  selectFields: SELECT_FIELDS,
} as const;

type Int8 = number | string | bigint;

// if the input type can be null, then the output type can also be null; cast(null as type) always results in null
type CastExpression<From, To> = AliasableExpression<
  From extends null ? To | null : To
>;

export function cast<T extends string | null>(
  expr: Expression<T>,
  type: 'bytea'
): CastExpression<T, Buffer>;
export function cast<T extends Int8 | null>(
  expr: Expression<T>,
  type: 'int4'
): CastExpression<T, number>;
// ... add any other casts you need

export function cast(
  expr: Expression<unknown>,
  type: ColumnDataType
): AliasableExpression<unknown> {
  return sql`cast(${expr} as ${sql.raw(type)})`;
}

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
