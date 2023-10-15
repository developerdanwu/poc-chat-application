import { type ExpressionBuilder } from 'kysely';
import { type DB } from '@prisma-generated/generated/types';
import { jsonArrayFrom } from 'kysely/helpers/postgres';

export const withAuthors = (eb: ExpressionBuilder<DB, 'chatroom'>) => {
  return jsonArrayFrom(
    eb
      .selectFrom('author as au')
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.author_id',
        'au.author_id'
      )
      .select([
        'au.first_name',
        'au.last_name',
        'au.user_id',
        'au.author_id',
        'au.role',
        'au.created_at',
        'au.updated_at',
      ])
      .whereRef('_authors_on_chatrooms.chatroom_id', '=', 'chatroom.id')
  ).as('authors');
};

export const withChatrooms = (eb: ExpressionBuilder<DB, 'author'>) => {
  return jsonArrayFrom(
    eb
      .selectFrom('chatroom')
      .innerJoin(
        '_authors_on_chatrooms',
        '_authors_on_chatrooms.chatroom_id',
        'chatroom.id'
      )
      .select((eb) => [
        'chatroom.id',
        'chatroom.status',
        'chatroom.type',
        'chatroom.created_at',
        'chatroom.updated_at',
        withAuthors(eb),
      ])
      .whereRef('_authors_on_chatrooms.author_id', '=', 'author.author_id')
  ).as('chatrooms');
};
