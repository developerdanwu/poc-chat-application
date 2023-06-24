import { type NextRequest, NextResponse } from 'next/server';
import { parseSlashCommandPayload } from '@/app/api/slack/_utils';
import { findSlackChatroom } from '@/app/api/slack/events_handlers/_message';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const pa = await req.text();
  const parsedPayload = parseSlashCommandPayload(pa);
  findSlackChatroom({
    channel: parsedPayload.channel_id,
  }).then((res) => {
    if (res) {
      if (!res.conversationSummary) {
        axios
          .post(parsedPayload.response_url, {
            text: 'no summary found',
          })
          .catch((e) => {
            console.log('ERROR', e);
          });
        return;
      }
      axios
        .post(parsedPayload.response_url, {
          text: res.conversationSummary,
        })
        .catch((e) => {
          console.log('ERROR', e);
        });
    }
  });

  return NextResponse.json({
    response_type: 'ephemeral',
    text: 'please wait...',
  });
}
