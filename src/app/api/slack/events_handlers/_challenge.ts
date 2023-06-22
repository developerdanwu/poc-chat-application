import { NextResponse } from 'next/server';

export function challenge(body: any) {
  console.log('req body challenge is:', body.challenge);

  return NextResponse.json({
    challenge: body.challenge,
  });
}
