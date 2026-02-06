import {NextResponse} from 'next/server';

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        {error: 'Invalid subscription object'},
        {status: 400},
      );
    }

    // TODO: Store the subscription in your database
    // Link it to the current user/tenant session
    console.log('Push subscription received:', subscription);

    return NextResponse.json({success: true});
  } catch (error: any) {
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
