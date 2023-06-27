import { type NextRequest, NextResponse } from 'next/server';
import { parseSlashCommandRequest, slackApi } from '@/app/api/slack/_utils';
import { callbackIdStore } from '@/app/api/slack/interactive/route';

export async function POST(req: NextRequest) {
  const bodyAsText = await req.text();
  const parsedPayload = parseSlashCommandRequest(bodyAsText);

  if (!parsedPayload.trigger_id) {
    return new NextResponse();
  }
  slackApi.views.open({
    trigger_id: parsedPayload.trigger_id,
    view: {
      callback_id: callbackIdStore.imagine,
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Generate Image',
        emoji: true,
      },
      submit: {
        type: 'plain_text',
        text: 'Submit',
        emoji: true,
      },
      close: {
        type: 'plain_text',
        text: 'Cancel',
        emoji: true,
      },
      blocks: [
        {
          block_id: 'target_channel',
          type: 'input',
          label: {
            type: 'plain_text',
            text: 'Select a channel to post the result on',
          },
          element: {
            default_to_current_conversation: true,
            action_id: 'target_select',
            type: 'conversations_select',
            response_url_enabled: true,
          },
        },
        {
          block_id: 'prompt',
          type: 'input',
          element: {
            type: 'plain_text_input',
            action_id: 'plain_text_input-action',
          },
          label: {
            type: 'plain_text',
            text: 'Prompt',
            emoji: true,
          },
        },
        {
          block_id: 'image_resolution',
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Image resolution (defaults to 256x256)',
          },
          accessory: {
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select',
              emoji: true,
            },
            options: [
              {
                text: {
                  type: 'plain_text',
                  text: '1024x1024 (best quality but most $$$)',
                  emoji: true,
                },
                value: '1024x1024',
              },
              {
                text: {
                  type: 'plain_text',
                  text: '512x512',
                  emoji: true,
                },
                value: '512x512',
              },
              {
                text: {
                  type: 'plain_text',
                  text: '256x256 (worst quality but cheapest)',
                  emoji: true,
                },
                value: '256x255',
              },
            ],
            action_id: 'static_select-action',
          },
        },
      ],
    },
  });

  return new NextResponse();
}
