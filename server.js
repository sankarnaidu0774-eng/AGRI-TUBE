const path = require('node:path');
const express = require('express');
const dotenv = require('dotenv');

// Load local secrets first; deployment platforms normally inject these themselves.
dotenv.config({ path: path.join(__dirname, '.env.local') });
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const required = (res, names) => {
  const missing = names.filter(name => !process.env[name]);
  if (missing.length) {
    res.status(503).json({ error: 'Integration not configured', missing });
    return false;
  }
  return true;
};

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Only public configuration is returned. Secret values never leave the server.
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    integrations: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      mux: Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET),
      youtube: Boolean(process.env.YOUTUBE_API_KEY),
      weather: Boolean(process.env.OPENWEATHER_API_KEY)
    }
  });
});

app.get('/api/weather', async (req, res, next) => {
  if (!required(res, ['OPENWEATHER_API_KEY'])) return;
  const city = String(req.query.city || 'Chennai').slice(0, 80);
  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.search = new URLSearchParams({ q: city, units: 'metric', appid: process.env.OPENWEATHER_API_KEY });
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Weather request failed' });
    res.set('Cache-Control', 'public, max-age=600');
    res.json({
      city: data.name,
      region: data.sys?.country || '',
      temperature: Math.round(data.main.temp),
      condition: data.weather?.[0]?.description || '',
      humidity: data.main.humidity,
      windKph: Math.round((data.wind?.speed || 0) * 3.6),
      icon: data.weather?.[0]?.icon || ''
    });
  } catch (error) { next(error); }
});

app.get('/api/youtube/search', async (req, res, next) => {
  if (!required(res, ['YOUTUBE_API_KEY'])) return;
  const query = String(req.query.q || 'sustainable agriculture').trim().slice(0, 120);
  if (!query) return res.status(400).json({ error: 'A search query is required' });
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({
      part: 'snippet', q: query, type: 'video', videoEmbeddable: 'true',
      safeSearch: 'strict', maxResults: '12', key: process.env.YOUTUBE_API_KEY
    });
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'YouTube request failed' });
    res.set('Cache-Control', 'public, max-age=900');
    res.json({
      videos: (data.items || []).map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
        embedUrl: `https://www.youtube-nocookie.com/embed/${item.id.videoId}`
      }))
    });
  } catch (error) { next(error); }
});

// Creates a direct-upload URL. The browser uploads the file to Mux, not through this server.
app.post('/api/uploads/mux', async (_req, res, next) => {
  if (!required(res, ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET'])) return;
  try {
    const Mux = require('@mux/ts');
    const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET });
    const corsOrigin = process.env.MUX_CORS_ORIGIN || process.env.APP_ORIGIN || 'http://localhost:3000';
    const upload = await mux.video.uploads.create({
      cors_origin: corsOrigin,
      new_asset_settings: { playback_policy: ['public'], mp4_support: 'none' }
    });
    res.status(201).json({ id: upload.id, url: upload.url });
  } catch (error) { next(error); }
});

// Call after a direct upload completes. Add authenticated user middleware in production.
app.post('/api/videos', async (req, res, next) => {
  if (!required(res, ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])) return;
  const { title, description = '', muxUploadId, category = 'Stories' } = req.body || {};
  if (!title || !String(title).trim() || !muxUploadId) {
    return res.status(400).json({ error: 'title and muxUploadId are required' });
  }
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data, error } = await supabase.from('videos').insert({
      title: String(title).trim().slice(0, 160), description: String(description).slice(0, 5000),
      mux_upload_id: String(muxUploadId), category: String(category).slice(0, 40), status: 'processing'
    }).select().single();
    if (error) throw error;
    res.status(201).json({ video: data });
  } catch (error) { next(error); }
});

app.use(express.static(__dirname, { dotfiles: 'deny', index: 'index.html' }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'The server could not complete this request' });
});
app.listen(port, '0.0.0.0', () => console.log(`Agriculture Tube running on http://0.0.0.0:${port}`));
