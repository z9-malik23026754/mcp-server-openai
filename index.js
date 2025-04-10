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
 * Extract structured meeting info (summary, startTime, endTime, attendees)
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
      return res.status(400).json({ error: 'Invalid JSON', raw: result });
    }

    res.json({ output: parsedOutput, tool_name: 'scheduleMeeting' });

  } catch (err) {
    console.error('❌ OpenAI Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to call OpenAI' });
  }
});


/**
 * 🛠 Tool: sendEmail
 * Input: { to, subject, body }
 */
app.post('/tools/sendEmail', async (req, res) => {
  const { to, subject, body } = req.body.input;

  // Integrate with real Gmail API here later if needed
  return res.json({
    output: `📬 Email sent to ${to} with subject "${subject}"`,
    tool_name: 'sendEmail'
  });
});

/**
 * 🛠 Tool: replyToEmail
 * Input: { messageId, body }
 */
app.post('/tools/replyToEmail', async (req, res) => {
  const { messageId, body } = req.body.input;

  return res.json({
    output: `↩️ Replied to message ID ${messageId} with: "${body}"`,
    tool_name: 'replyToEmail'
  });
});

/**
 * 🛠 Tool: labelEmail
 * Input: { messageId, labelName }
 */
app.post('/tools/labelEmail', async (req, res) => {
  const { messageId, labelName } = req.body.input;

  return res.json({
    output: `🏷️ Labeled email ${messageId} as "${labelName}"`,
    tool_name: 'labelEmail'
  });
});

/**
 * 🧠 A2A Support (Optional agent-to-agent interface)
 */
app.post('/a2a', async (req, res) => {
  const task = req.body?.['a2a.performTask']?.task;
  const input = req.body?.['a2a.performTask']?.input;

  if (!task || !input) {
    return res.status(400).json({ error: 'Invalid A2A payload' });
  }

  if (task === 'sendEmail') {
    return res.json({
      output: `✅ [A2A] Email sent to ${input.to}`,
      tool_name: 'sendEmail'
    });
  }

  return res.status(404).json({ error: `Unknown task: ${task}` });
});

/**
 * 🩺 Health Check
 */
app.get('/', (req, res) => {
  res.send('✅ MCP Email + Meeting Tool Server is running');
});

/**
 * 🚀 Start
 */
app.listen(port, () => {
  console.log(`✅ MCP server running at http://localhost:${port}`);
});
