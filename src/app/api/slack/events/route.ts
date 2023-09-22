import {type NextRequest, NextResponse} from 'next/server';
import {validateSlackRequest} from './_validate';
import {env} from '@/env.mjs';
import {type SlackEvent} from '@slack/bolt';
import {challenge} from '@/app/api/slack/events/_events_handlers/_challenge';
import {app_mention} from '@/app/api/slack/events/_events_handlers/_app_mention';
import {message, sendTyping,} from '@/app/api/slack/events/_events_handlers/_message';
import {fileShare} from '@/app/api/slack/events/_events_handlers/_file_share';

// TODO: add app URI to homescreen of app
// https://slack.com/oauth/v2/authorize?scope=app_mentions:read,channels:read,chat:write,chat:write.public,commands,files:write,im:history,files:read&user_scope=im:history&redirect_uri=https://8f3c-185-174-108-6.ngrok-free.app&client_id=621471499524.5442157267155

// can use apps.event.authorizations.list to get list of authorised users
export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = body.type;

  if (type === 'url_verification') {
    return challenge(body);
  } else if (validateSlackRequest(req, body, env.SLACK_SIGNING_SECRET)) {
    if (type === 'event_callback') {
      const event = body.event as SlackEvent;

      switch (event.type) {
        case 'app_uninstalled': {
          console.log('app uninstalled');
          return NextResponse.json({ ok: true });
        }
        case 'app_mention': {
          app_mention({
            data: event,
          });
          return NextResponse.json({ ok: true });
        }
        case 'app_home_opened': {
          console.log(body);
          return NextResponse.json({ ok: true });
        }
        case 'message': {
          // HACK: subtype support is non-existent in bot message API
          if (event.subtype === 'bot_message' || 'bot_id' in event) {
            return NextResponse.json({ ok: true });
          }
          if (
            event.subtype === 'message_changed' ||
            event.subtype === 'message_deleted' ||
            event.subtype === 'thread_broadcast' ||
            event.subtype === 'channel_archive' ||
            event.subtype === 'channel_join' ||
            event.subtype === 'message_replied' ||
            event.subtype === 'channel_leave' ||
            event.subtype === 'channel_topic' ||
            event.subtype === 'channel_purpose' ||
            event.subtype === 'channel_name' ||
            event.subtype === 'channel_unarchive' ||
            event.subtype === 'channel_posting_permissions' ||
            event.subtype === 'ekm_access_denied'
          ) {
            return NextResponse.json({ ok: true });
          }

          if (event.subtype === 'file_share') {
            fileShare({ data: event });
            return NextResponse.json({ ok: true });
          }

          const typingText = await sendTyping({ data: event });

          message({
            data: event,
            typingResponse: typingText,
          });
          return NextResponse.json({ ok: true });
        }
        default:
          break;
      }
    } else {
      console.log('body:', req.body);
    }
  } else {
    return NextResponse.json({ ok: true });
  }
}
