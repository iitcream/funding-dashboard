export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured on server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { company, sector, subsector, model, amount, stage, investors } = body;

  const prompt = `You are a startup research analyst. Using Google Search, find and compile a detailed profile for the Indian startup "${company}" which operates in the ${sector} sector (sub-sector: ${subsector}, business model: ${model}). It recently raised ${amount} in a ${stage} round from investors: ${investors}.

Search the web and provide the following information in strict JSON format (use "N/A" if not found):
{
  "description": "2-3 sentence description of what the company does and its value proposition",
  "founded": "year founded",
  "founders": "founder name(s) and brief background",
  "hq": "city, state",
  "website": "domain only e.g. company.com",
  "employees": "employee count or range",
  "valuation": "latest valuation in USD or INR",
  "customers": "customer or registered user count",
  "downloads": "app download count if applicable, else N/A",
  "revenue": "annual revenue if known",
  "keyProducts": "main products or services",
  "fundingHistory": "all known funding rounds as a single string",
  "competitors": "2-3 key Indian competitors",
  "latestNews": "1-2 most recent notable developments",
  "sources": ["url1", "url2", "url3"]
}
Return ONLY valid JSON. No markdown, no backticks, no explanation.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      throw new Error(err.error?.message || `Gemini API error ${geminiRes.status}`);
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join('') || '';

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON returned by Gemini');

    const info = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ ok: true, data: info }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
