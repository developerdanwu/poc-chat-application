import {type NextRequest, NextResponse} from 'next/server';
import {parseSlashCommandRequest} from '@/app/api/slack/_utils';
import {findSlackChatroom} from '@/app/api/slack/events/_events_handlers/_message';
import axios from 'axios';
import {type SlashCommand} from '@slack/bolt';

// save user id and team id to verify if user is authorised to use the app??
export async function POST(req: NextRequest) {
  const bodyAsText = await req.text();
  const parsedPayload = parseSlashCommandRequest<SlashCommand>(bodyAsText);
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
