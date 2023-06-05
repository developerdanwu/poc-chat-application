import { type NextApiRequest, type NextApiResponse } from 'next';
import { Webhook } from 'svix';
import { buffer } from 'micro';
import { env } from '@/env.mjs';
import { type ClerkWebhookEvent } from '@/server/webhooks';
import { type User } from '@clerk/nextjs/api';
import { db } from '@/server/db';
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import utc from 'dayjs/plugin/utc';
import { Role } from '../../../prisma/generated/types';

dayjs.extend(advancedFormat);
dayjs.extend(utc);

const secret = env.WEBHOOK_SECRET;
type UnwantedKeys =
  | 'emailAddresses'
  | 'firstName'
  | 'lastName'
  | 'primaryEmailAddressId'
  | 'primaryPhoneNumberId'
  | 'phoneNumbers';

type UserInterface = Omit<User, UnwantedKeys> & {
  email_addresses: {
    email_address: string;
    id: string;
  }[];
  primary_email_address_id: string;
  first_name: string;
  last_name: string;
  primary_phone_number_id: string;
  phone_numbers: {
    phone_number: string;
    id: string;
  }[];
};

type Event = {
  data: UserInterface;
  object: 'event';
  type: ClerkWebhookEvent;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const payload = (await buffer(req)).toString();
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];
    if (
      !svixId ||
      !svixTimestamp ||
      !svixSignature ||
      typeof svixId !== 'string' ||
      typeof svixTimestamp !== 'string' ||
      typeof svixSignature !== 'string'
    ) {
      return res.status(400).send('Invalid webhook');
    }
    const svixHeaders = {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    } as const;

    let msg: Event | null = null;
    const wh = new Webhook(secret);
    try {
      msg = wh.verify(payload, svixHeaders) as Event;
    } catch (e) {
      return res.status(400).send('Invalid webhook');
    }

    if (msg) {
      const event = msg.type;
      switch (event) {
        case 'user.created': {
          try {
            await db.transaction().execute(async (trx) => {
              await trx
                .insertInto('author')
                .values({
                  user_id: msg ? msg.data.id : '',
                  first_name: msg ? msg.data.first_name : '',
                  last_name: msg ? msg.data.last_name : '',
                  email: msg ? msg.data.email_addresses[0]?.email_address : '',
                  role: Role.USER,
                  updated_at: dayjs.utc().toISOString(),
                })
                .execute();
            });
            return res.status(200).send('ok');
          } catch (e) {
            return res.status(200).send('ok');
          }
        }
        case 'user.updated': {
          try {
            const targetAuthor = await db
              .selectFrom('author')
              .selectAll()
              .where(({ cmpr }) => cmpr('user_id', '=', msg!.data.id))
              .executeTakeFirst();
            if (targetAuthor) {
              await db.transaction().execute(async (trx) => {
                await trx
                  .updateTable('author')
                  .set({
                    first_name: msg ? msg.data.first_name : '',
                    last_name: msg ? msg.data.last_name : '',
                    email: msg
                      ? msg.data.email_addresses[0]?.email_address
                      : '',
                    updated_at: dayjs.utc().toISOString(),
                  })
                  .where(({ cmpr }) => cmpr('user_id', '=', msg!.data.id))
                  .execute();
              });
              return res.status(200).send('ok');
            }
            await db.transaction().execute(async (trx) => {
              await trx
                .insertInto('author')
                .values({
                  user_id: msg ? msg.data.id : '',
                  first_name: msg ? msg.data.first_name : '',
                  last_name: msg ? msg.data.last_name : '',
                  email: msg ? msg.data.email_addresses[0]?.email_address : '',
                  role: Role.USER,
                  updated_at: dayjs.utc().toISOString(),
                })
                .execute();
            });
            return res.status(200).send('ok');
          } catch (e) {
            console.log('ERROR', e);
            return res.status(500).send('Database error');
          }
        }
        default: {
          return res.status(400).send('Event not implemented');
        }
      }
    }
  }
}
