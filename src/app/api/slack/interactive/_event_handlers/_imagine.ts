import { type ViewSubmitAction } from '@slack/bolt';
import axios from 'axios';
import { genericOpenAiModel, slackApi } from '@/app/api/slack/_utils';

export async function imagine(payload: ViewSubmitAction) {
  if (!payload.response_urls) {
    return;
  }

  await Promise.allSettled(
    payload.response_urls?.map(async (resObj) => {
      const res = await axios.post(resObj.response_url, {
        text: 'generating image, please wait...',
        response_type: 'ephemeral',
      });
      return res;
    })
  );

  const formPayloadcast = payload.view.state.values as unknown as {
    target_channel: {
      target_select: {
        type: string;
        selected_conversation: string;
      };
    };
    prompt: {
      'plain_text_input-action': {
        value: string;
      };
    };
    image_resolution: {
      'static_select-action': {
        type: string;
        selected_option: {
          text: {
            type: string;
            text: string;
            emoji: boolean;
          };
          value: null | '1024x1024' | '256x256' | '512x512';
        };
      };
    };
  };

  const generatedImage = await genericOpenAiModel
    .createImage({
      prompt: formPayloadcast.prompt['plain_text_input-action'].value,
      n: 1,
      size:
        formPayloadcast.image_resolution['static_select-action'].selected_option
          ?.value || '256x256',
    })
    .catch(async (e) => {
      if (axios.isAxiosError(e)) {
        const errorCast = e.response?.data as {
          error: {
            code: null | number;
            message: string;
            param: null | string;
            type: string;
          };
        };
        payload.response_urls?.forEach((resObj) => {
          axios.post(resObj.response_url, {
            replace_original: 'true',
            text:
              errorCast.error?.message ??
              'an error has occurred while generating image. Please try again.',
            response_type: 'ephemeral',
          });
        });

        console.log(e.response?.data);
      }
    });

  if (!generatedImage) {
    await Promise.allSettled(
      payload.response_urls?.map(async (resObj) => {
        const res = await axios.post(resObj.response_url, {
          replace_original: 'true',
          text: 'an error has occurred while generating image. Please try again.',
          response_type: 'ephemeral',
        });
        return res;
      })
    );
    return;
  }

  await Promise.allSettled(
    generatedImage.data.data?.map(async (image) => {
      if (image.url) {
        const generatedImageBuffer = await axios
          .get(image.url, {
            responseType: 'arraybuffer',
          })
          .catch((e) => {
            console.log(e);
          });

        if (generatedImageBuffer) {
          await slackApi.files
            .uploadV2({
              channel_id: 'D05D2MJPX28',
              file: Buffer.from(generatedImageBuffer.data, 'base64'),
              filename: 'chatgpt_generated',
            })
            .catch((e) => console.log(e));
        }
      }
    })
  );
}
