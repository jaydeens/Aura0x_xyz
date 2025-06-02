import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface DailyLesson {
  title: string;
  content: string;
  keyTakeaways: string[];
  difficulty: string;
  estimatedReadTime: number;
}

export async function generateDailyLessons(count: number = 1): Promise<DailyLesson[]> {
  try {
    const prompt = `Generate ${count} educational Web3/crypto lessons for KOLs and crypto enthusiasts. Each lesson should be comprehensive and actionable. Return JSON in this exact format:

{
  "lessons": [
    {
      "title": "Lesson title",
      "content": "Detailed lesson content (2-3 paragraphs)",
      "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
      "difficulty": "beginner|intermediate|advanced",
      "estimatedReadTime": 15
    }
  ]
}

Topics should cover areas like DeFi, NFTs, trading strategies, security, tokenomics, Web3 development, market analysis, or emerging trends. Make the content educational and valuable for building crypto expertise.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Web3 educator creating high-quality lessons for crypto KOLs and enthusiasts. Focus on practical, actionable content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.lessons || !Array.isArray(result.lessons)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result.lessons;
  } catch (error) {
    console.error("Error generating daily lessons:", error);
    throw new Error("Failed to generate daily lessons: " + (error as Error).message);
  }
}

export async function generateLessonAnalysis(topic: string): Promise<DailyLesson> {
  try {
    const prompt = `Create a detailed Web3 lesson about: "${topic}". Return JSON in this exact format:

{
  "title": "Specific lesson title",
  "content": "Comprehensive lesson content (3-4 paragraphs with real examples and actionable insights)",
  "keyTakeaways": ["key point 1", "key point 2", "key point 3", "key point 4"],
  "difficulty": "beginner|intermediate|advanced",
  "estimatedReadTime": 20
}

Make this lesson valuable for crypto KOLs who want to build their expertise and share knowledge with their audience.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Web3 educator. Create in-depth, practical lessons that Web3 users can learn from and share."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 1500
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.title || !result.content || !result.keyTakeaways) {
      throw new Error("Invalid lesson format from OpenAI");
    }

    return result as DailyLesson;
  } catch (error) {
    console.error("Error generating lesson analysis:", error);
    throw new Error("Failed to generate lesson analysis: " + (error as Error).message);
  }
}

export async function validateTweetContent(tweetText: string, lessonTitle: string): Promise<boolean> {
  try {
    const prompt = `Analyze if this tweet is related to completing a crypto/Web3 lesson and contains certification elements:

Tweet: "${tweetText}"
Lesson: "${lessonTitle}"

Check if the tweet:
1. Mentions completing a lesson or learning about crypto/Web3
2. Contains hashtags like #AuraCertified or similar certification terms
3. Shows engagement with the lesson topic
4. Appears authentic (not spam)

Return JSON: { "isValid": true/false, "reason": "explanation" }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a content validator for a Web3 education platform. Verify if tweets demonstrate legitimate lesson completion."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 200
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.isValid === true;
  } catch (error) {
    console.error("Error validating tweet content:", error);
    return false; // Fail safely
  }
}
