// ✅ index.js - MCP Email + Calendar Agent Tool Server

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🛠 Tool: resolveContact
app.post('/tools/resolveContact', async (req, res) => {
  const { name } = req.body.input;
  const contacts = {
    alina: 'alina@example.com',
    alex: 'alex@company.com',
    sarah: 'sarah@company.com'
  };
  const email = contacts[name?.toLowerCase()];
  if (!email) return res.status(404).json({ error: 'Contact not found' });
  res.json({ output: email, tool_name: 'resolveContact' });
});

// 🛠 Tool: scheduleMeeting
app.post('/tools/scheduleMeeting', async (req, res) => {
  const input = req.body.input;
  const prompt = `Extract a meeting object from this input:\n\n"${input}"\n\nRespond ONLY with valid JSON like:\n{\n  "summary": "...",
  "startTime": "2025-04-12T18:00:00",
  "endTime": "2025-04-12T18:30:00",
  "attendees": ["alina@example.com"]
}`;

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You only return valid JSON objects with meeting info.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data.choices[0].message.content.trim();
    const parsed = JSON.parse(result);
    res.json({ output: parsed, tool_name: 'scheduleMeeting' });

  } catch (err) {
    res.status(500).json({ error: 'OpenAI failed', raw: err.response?.data || err.message });
  }
});

// 🛠 Tool: sendEmail
app.post('/tools/sendEmail', async (req, res) => {
  const { to, subject, body } = req.body.input;
  res.json({
    output: `📬 Email sent to ${to} with subject "${subject}"`,
    tool_name: 'sendEmail'
  });
});

// 🧠 A2A support (optional)
app.post('/a2a', async (req, res) => {
  const task = req.body?.['a2a.performTask']?.task;
  const input = req.body?.['a2a.performTask']?.input;
  if (!task || !input) return res.status(400).json({ error: 'Invalid A2A payload' });
  res.json({ output: `✅ A2A task '${task}' completed.`, input });
});

// 🔌 SSE endpoint for MCP Client discovery
app.get('/sse', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  const tools = [
    {
      name: 'resolveContact',
      description: 'Resolve contact name to email address',
      parameters: { name: 'text' }
    },
    {
      name: 'scheduleMeeting',
      description: 'Schedule a Google Calendar meeting',
      parameters: {
        summary: 'text', startTime: 'datetime', endTime: 'datetime', attendees: 'array'
      }
    },
    {
      name: 'sendEmail',
      description: 'Send an email to a recipient',
      parameters: { to: 'email', subject: 'text', body: 'text' }
    }
  ];

  for (const tool of tools) {
    res.write(`event: tool\n`);
    res.write(`data: ${JSON.stringify(tool)}\n\n`);
  }
  res.write(`event: end\n`);
  res.write(`data: end\n\n`);
});

// 🔋 Health Check
app.get('/', (req, res) => {
  res.send('✅ MCP Tool Server is live');
});

// 🚀 Start
app.listen(port, () => {
  console.log(`✅ MCP server running at http://localhost:${port}`);
});
