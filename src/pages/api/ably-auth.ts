import { type NextApiRequest, type NextApiResponse } from 'next';
import { ablyRest } from '@/server/api/trpc';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const auth = getAuth(req);

      console.log('AUTHEN', auth.userId);
      if (!auth.userId) {
        return res.status(401).send('Not Authorized');
      }

      const token = await ablyRest.auth.createTokenRequest({
        clientId: auth?.userId,
      });

      console.log('TOKEN', token);
      return res.status(200).send(token);
    } catch (e) {
      console.log('err', e);
      return res.status(500).send('An unexpected error occurred.');
    }
  }
}
