import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateSocialContent(prompt: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a professional social media content creator. You create engaging, platform-specific content.
            When given a prompt, you'll create three versions of the content optimized for different platforms:
            
            - Twitter: Maximum 280 characters, casual tone, includes hashtags
            - LinkedIn: Professional tone, 2-3 paragraphs, business-focused, includes relevant hashtags
            - Instagram: Casual and engaging, emoji-friendly, around 2 paragraphs, includes relevant hashtags
            
            Format the response as JSON with three fields: twitter, linkedin, and instagram.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content || '{"twitter": "", "linkedin": "", "instagram": ""}');
  } catch (error) {
    console.error('Error generating social content:', error);
    throw new Error('Failed to generate social content');
  }
}