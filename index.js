require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

/**
 * 🛠 Tool: scheduleMeeting
 * This tool extracts structured meeting data (summary, startTime, endTime, attendees) from natural language input
 */
app.post('/tools/scheduleMeeting', async (req, res) => {
  const input = req.body.input;

  const prompt = `Extract a meeting object from the following input.

Input:
"${input}"

Respond ONLY with valid JSON in this format:
{
  "summary": "Weekly Sync",
  "startTime": "2025-04-15T14:00:00",
  "endTime": "2025-04-15T14:30:00",
  "attendees": ["alex@example.com"]
}

Do NOT include any explanation. Do NOT wrap the JSON in markdown or code blocks.
Just return the plain JSON.`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              'You are a scheduling assistant that ALWAYS returns only structured JSON objects with no explanation.'
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

    const result = response.data.choices[0].message.content.trim();

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result);
    } catch (err) {
      console.error('❌ JSON parsing failed. Raw response:', result);
      return res.status(400).json({
        error: 'Failed to parse JSON from OpenAI response',
        raw: result
      });
    }

    res.json({
      output: parsedOutput,
      tool_name: 'scheduleMeeting'
    });

  } catch (err) {
    console.error('❌ OpenAI API Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to call OpenAI API' });
  }
});

// 🩺 Health check route
app.get('/', (req, res) => {
  res.send('✅ MCP Server is running');
});

// Start the server
app.listen(port, () => {
  console.log(`✅ MCP server running on http://localhost:${port}`);
});
