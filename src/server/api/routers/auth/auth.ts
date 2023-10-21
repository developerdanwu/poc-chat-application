import { createTRPCRouter } from '@/server/api/trpc';
import isUserInDatabase from '@/server/api/routers/auth/procedures/isUserInDatabase';
import seedAuthor from '@/server/api/routers/auth/procedures/seedAuthor';

export const auth = createTRPCRouter({
  isUserInDatabase,
  seedAuthor,
});
