// This code snippet is based on https://github.com/antonputra/tutorials/tree/main/lessons/076

import { type NextRequest } from 'next/server';

export function validateSlackRequest(
  event: NextRequest,
  body: any,
  signingSecret: string
) {
  // const requestBody = JSON.stringify(body);
  //
  // const headers = event.headers;
  //
  // const timestamp = headers.get('x-slack-request-timestamp');
  // const slackSignature = headers.get('x-slack-signature');
  // const baseString = 'v0:' + timestamp + ':' + requestBody;
  //
  // const hmac = crypto
  //   .createHmac('sha256', signingSecret)
  //   .update(new TextEncoder().encode(baseString))
  //   .digest('hex');
  // const computedSlackSignature = 'v0=' + hmac;
  // const isValid = computedSlackSignature === slackSignature;

  return true;
}
