// Serverless function for OpenAI API calls
// This can be deployed to Vercel, Netlify, or similar platforms

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model = 'gpt-3.5-turbo', maxTokens = 500, temperature = 0.3 } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Get API key from environment variables (server-side only)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Make request to OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json().catch(() => ({}));
      
      // Handle different error types
      switch (openAIResponse.status) {
        case 401:
          console.error('OpenAI API authentication failed');
          return res.status(500).json({ error: 'Authentication failed' });
        case 429:
          return res.status(429).json({ error: 'Rate limit exceeded' });
        case 400:
          return res.status(400).json({ error: errorData.error?.message || 'Invalid request' });
        default:
          console.error('OpenAI API error:', openAIResponse.status, errorData);
          return res.status(500).json({ error: 'AI service temporarily unavailable' });
      }
    }

    const data = await openAIResponse.json();
    
    // Extract the response content
    const messageContent = data.choices[0]?.message?.content;
    if (!messageContent) {
      return res.status(500).json({ error: 'No response content received' });
    }

    // Return the response
    res.status(200).json({
      success: true,
      data: messageContent.trim(),
      usage: data.usage // Optional: include token usage info
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}