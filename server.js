require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/weather', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

    try {
        const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        let response = await fetch(oneCallUrl);

        if (response.ok) {
            const data = await response.json();
            return res.json({ source: 'onecall', data });
        }

        console.log(`OneCall 3.0 returned ${response.status}, falling back to 2.5 API...`);
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

        const [curRes, fcRes] = await Promise.all([fetch(currentUrl), fetch(forecastUrl)]);

        if (!curRes.ok) {
            const err = await curRes.json().catch(() => ({}));
            return res.status(curRes.status).json({ error: err.message || `API error (${curRes.status})` });
        }

        const curData = await curRes.json();
        const fcData = await fcRes.json();
        return res.json({ source: '2.5', current: curData, forecast: fcData });

    } catch (err) {
        console.error('Weather fetch error:', err.message);
        res.status(500).json({ error: 'Failed to fetch weather data.' });
    }
});

app.get('/api/geocode', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q (city name) is required' });

    try {
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) return res.status(response.status).json({ error: 'Geocoding failed.' });
        const data = await response.json();
        if (!data.length) return res.status(404).json({ error: 'City not found.' });
        res.json({ lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country });
    } catch (err) {
        console.error('Geocode error:', err.message);
        res.status(500).json({ error: 'Geocoding failed.' });
    }
});

app.get('/api/reverse', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

    try {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) return res.json({ name: 'Unknown Location' });
        const data = await response.json();
        if (!data.length) return res.json({ name: 'Unknown Location' });
        res.json({ name: `${data[0].name}, ${data[0].country}` });
    } catch {
        res.json({ name: 'Unknown Location' });
    }
});

app.get('/api/tile/:layer/:z/:x/:y', async (req, res) => {
    const { layer, z, x, y } = req.params;
    try {
        const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) return res.status(response.status).send('Tile not found');
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=600');
        const buffer = Buffer.from(await response.arrayBuffer());
        res.send(buffer);
    } catch {
        res.status(500).send('Tile fetch failed');
    }
});

app.listen(PORT, () => {
    console.log(`\n  ⛅ WeatherLive server running at http://localhost:${PORT}\n`);
    if (!API_KEY) {
        console.warn('  ⚠️  OPENWEATHER_API_KEY is not set in .env file!\n');
    }
});
