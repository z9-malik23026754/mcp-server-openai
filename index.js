require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Use Render's dynamic port (fallback to 3000 if running locally)
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Tool: scheduleMeeting
app.post('/tools/scheduleMeeting', async (req, res) => {
  const input = req.body.input;

  const prompt = `Extract a structured meeting object from this input:
"${input}"

Return a JSON object like:
{
  "summary": "...",
  "startTime": "2025-04-15T15:00:00",
  "endTime": "2025-04-15T15:30:00",
  "attendees": ["name@example.com"]
}
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful assistant that extracts structured meeting data from natural text. Always return a valid JSON object with keys: summary, startTime, endTime, attendees.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.choices[0].message.content;

    // Try to validate JSON (optional safety)
    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result);
    } catch {
      // Return raw if not valid JSON — n8n will handle it later
      parsedOutput = result;
    }

    res.json({
      output: parsedOutput,
      tool_name: 'scheduleMeeting'
    });

  } catch (err) {
    console.error('OpenAI Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ MCP Server is running');
});

app.listen(port, () => {
  console.log(`✅ MCP server running on http://localhost:${port}`);
});
