// Function to generate location metadata using GPT

interface OpenAIMessage {
  role: string;
  content: string;
}

interface OpenAIResponseFormat {
  type: string;
}

interface OpenAIResponse {
  choices: Array<{
    message?: {
      content: string;
    };
  }>;
}

async function callOpenAI(apiKey: string, messages: OpenAIMessage[], responseFormat: OpenAIResponseFormat) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      response_format: responseFormat,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  return await response.json() as OpenAIResponse;
}

export interface LocationMetadata {
  description: string;
  keywords: string[];
  localAreaKeywords: string[];
}

export async function generateLocationMetadata(
  businessName: string,
  businessType: string,
  locationName: string,
  city: string,
  state: string,
  apiKey: string
): Promise<LocationMetadata> {
  try {
    const prompt = `Generate SEO metadata for a ${businessType} business called "${businessName}" at their "${locationName}" location in ${city}, ${state}.
    
    Please provide:
    1. A concise, engaging description (1-2 sentences) highlighting what makes this location special
    2. 5-7 relevant SEO keywords for this business location
    3. 5-7 local area keywords that people in ${city}, ${state} might search for when looking for a ${businessType} business
    
    Format the response as a JSON object with the following structure:
    {
      "description": "...",
      "keywords": ["keyword1", "keyword2", ...],
      "localAreaKeywords": ["local keyword1", "local keyword2", ...]
    }`;

    const messages: OpenAIMessage[] = [
      {
        role: "system",
        content: "You are a helpful SEO assistant that generates metadata for local businesses."
      },
      {
        role: "user",
        content: prompt
      }
    ];

    const response = await callOpenAI(apiKey, messages, { type: "json_object" });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    return JSON.parse(content) as LocationMetadata;
  } catch (error) {
    console.error(`Error generating location metadata: ${error}`);
    // Return default metadata if API call fails
    return {
      description: `Visit ${businessName} at our ${locationName} location in ${city}, ${state} for quality ${businessType.toLowerCase()} services.`,
      keywords: [
        `${businessName} ${city}`,
        `${businessType} ${city}`,
        `${locationName} ${businessType}`,
        `${businessType} services ${city}`
      ],
      localAreaKeywords: [
        `${businessType} near me`,
        `best ${businessType} ${city}`,
        `${businessType} ${city} ${state}`,
        `local ${businessType} ${city}`
      ]
    };
  }
}
