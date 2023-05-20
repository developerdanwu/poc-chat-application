import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { ablyRest } from '@/server/api/trpc';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const auth = await getAuth(req);
      if (auth.userId) {
        const token = await ablyRest.auth.createTokenRequest({
          clientId: auth.userId,
        });

        console.log('TOKEN', token);
        return res.status(200).send(token);
      }
      return res.status(401);
    } catch (e) {
      return res.status(500).send('An unexpected error occurred.');
    }
  }
}
