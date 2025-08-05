export async function existsingCheck(shortcode: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/exists/${shortcode}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to check shortcode');
  }

  const data = await res.json();
  return data;
}