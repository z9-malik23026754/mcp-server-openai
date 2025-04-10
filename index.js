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
 * Extracts structured meeting info (summary, startTime, endTime, attendees)
 * from natural text using OpenAI GPT-4
 */
app.post('/tools/scheduleMeeting', async (req, res) => {
  const input = req.body.input;

  const prompt = `
You are a scheduling tool. Extract structured meeting information from the input.

⚠️ Respond ONLY with a valid JSON object in the EXACT format below:
{
  "summary": "Meeting with Alina",
  "startTime": "2025-04-12T18:00:00",
  "endTime": "2025-04-12T18:30:00",
  "attendees": ["alina@example.com"]
}

❌ DO NOT explain
❌ DO NOT use markdown or backticks
❌ DO NOT say anything else

INPUT:
"${input}"
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that ONLY returns JSON. No explanation. No markdown. No commentary.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
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
      console.error('❌ Failed to parse OpenAI response as JSON:', result);
      return res.status(400).json({
        error: 'Invalid JSON received from OpenAI',
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

// 🚀 Start the server
app.listen(port, () => {
  console.log(`✅ MCP server running on http://localhost:${port}`);
});

