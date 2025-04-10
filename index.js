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

  const prompt = `You are an AI assistant that extracts structured meeting details from natural language and returns them in strict JSON format.

INPUT:
"${input}"

RULES:
- Do NOT explain anything.
- Do NOT include introductory text, markdown, or commentary.
- Your response MUST be a single valid JSON object.

EXAMPLE FORMAT:
{
  "summary": "Meeting with Alina",
  "startTime": "2025-04-12T18:00:00",
  "endTime": "2025-04-12T18:30:00",
  "attendees": ["alina@example.com"]
}

RETURN ONLY JSON.
`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You only respond with clean JSON objects. No explanations. No text outside the JSON.'
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
