// api/anthropic.js
// Sits between Cert-e and Anthropic's API.
// Holds the API key on the server so it never ships with the app.

export default async function handler(req, res) {
  // Allow the app to call us from any origin (we'll tighten before public launch).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Browsers send an "OPTIONS" check before a real request — answer it here.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only accept POST; nothing else is valid.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  // Grab the API key from Vercel's environment variables.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Proxy not configured: ANTHROPIC_API_KEY missing' });
  }

  try {
    // Forward the app's request body to Anthropic, adding the API key.
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy request failed', detail: String(err) });
  }
}
