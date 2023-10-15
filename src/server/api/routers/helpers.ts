import { type ExpressionBuilder } from 'kysely';
import {
  type Author,
  type Chatroom,
  type DB,
} from '@prisma-generated/generated/types';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

export const CHATROOM_ALIAS = 'c' as const;
export const AUTHOR_ALIAS = 'au' as const;
export const withAuthors = (
  eb: ExpressionBuilder<DB & { [CHATROOM_ALIAS]: Chatroom }, 'c'>
) => {
  return jsonArrayFrom(
    eb
      .selectFrom(`author as ${AUTHOR_ALIAS}`)
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.author_id',
        `${AUTHOR_ALIAS}.author_id`
      )
      .select([
        `${AUTHOR_ALIAS}.first_name`,
        `${AUTHOR_ALIAS}.last_name`,
        `${AUTHOR_ALIAS}.user_id`,
        `${AUTHOR_ALIAS}.author_id`,
        `${AUTHOR_ALIAS}.role`,
        `${AUTHOR_ALIAS}.created_at`,
        `${AUTHOR_ALIAS}.updated_at`,
      ])
      .whereRef(
        '_authors_on_chatrooms.chatroom_id',
        '=',
        `${CHATROOM_ALIAS}.id`
      )
  ).as('authors');
};

export const withChatrooms = (
  eb: ExpressionBuilder<DB & { au: Author }, 'au'>
) => {
  return jsonArrayFrom(
    eb
      .selectFrom(`chatroom as ${CHATROOM_ALIAS}`)
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.chatroom_id',
        `${CHATROOM_ALIAS}.id`
      )
      .select((eb) => [
        `${CHATROOM_ALIAS}.id`,
        `${CHATROOM_ALIAS}.status`,
        `${CHATROOM_ALIAS}.type`,
        `${CHATROOM_ALIAS}.created_at`,
        `${CHATROOM_ALIAS}.updated_at`,
        withAuthors(eb),
      ])
      .whereRef(
        '_authors_on_chatrooms.author_id',
        '=',
        `${AUTHOR_ALIAS}.author_id`
      )
  ).as('chatrooms');
};
