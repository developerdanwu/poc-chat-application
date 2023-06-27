import { type NextRequest, NextResponse } from 'next/server';
import { parseSlashCommandRequest } from '@/app/api/slack/_utils';
import { type ViewSubmitAction } from '@slack/bolt';
import { imagine } from '@/app/api/slack/interactive/_event_handlers/_imagine';

export const callbackIdStore = {
  imagine: 'imageine',
};

export async function POST(req: NextRequest) {
  const bodyAsText = await req.text();
  const parsedBody = parseSlashCommandRequest<{
    payload: string;
  }>(bodyAsText);
  const parsedPayload = JSON.parse(parsedBody.payload) as ViewSubmitAction;

  switch (parsedPayload.view.callback_id) {
    case callbackIdStore.imagine: {
      imagine(parsedPayload);
      break;
    }
    default:
      break;
  }

  return new NextResponse();
}
