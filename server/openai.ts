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
    const prompt = `Generate ${count} short, practical Web3 aura-building tip focused on specific actions someone can take today to improve their Web3 reputation. Keep it simple and actionable. Return JSON in this exact format:

{
  "lessons": [
    {
      "title": "Simple, actionable tip title (e.g., 'Share Your DeFi Wins on Twitter')",
      "content": "1-2 paragraphs with specific, actionable advice. Focus on WHAT to do and HOW to do it, not theoretical explanations. Include concrete examples.",
      "keyTakeaways": ["specific action 1", "specific action 2", "specific action 3"],
      "difficulty": "beginner",
      "estimatedReadTime": 5
    }
  ]
}

Focus on simple, daily actions like: posting about successful trades, sharing market insights, engaging with crypto Twitter, participating in Discord communities, documenting your learning journey, helping newcomers, sharing useful tools/resources, or building in public. Make it practical and immediately actionable.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Web3 educator specializing in teaching users how to build their aura and reputation in the Web3 space. Focus on practical strategies for gaining credibility, influence, and respect in crypto communities."
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

export interface LessonQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateLessonQuiz(lessonTitle: string, lessonContent: string): Promise<LessonQuiz> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert quiz creator for Web3 aura-building lessons. Create simple multiple-choice questions about which actions build aura vs which actions reduce aura."
        },
        {
          role: "user",
          content: `Based on this lesson about building Web3 aura:
          
          Title: "${lessonTitle}"
          Content: "${lessonContent}"
          
          Create a simple multiple-choice question asking which action will INCREASE someone's Web3 aura. Include 3 aura-reducing actions and 1 aura-building action as options.
          
          Respond in JSON format:
          {
            "question": "Which of the following actions will INCREASE your Web3 aura?",
            "options": ["aura-reducing action 1", "aura-reducing action 2", "CORRECT: aura-building action", "aura-reducing action 3"],
            "correctAnswer": 2,
            "explanation": "Brief explanation of why this action builds aura and why the others don't"
          }`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz");
  }
}

export async function validateTweetContent(tweetText: string, lessonTitle: string): Promise<boolean> {
  try {
    const prompt = `Analyze if this tweet demonstrates understanding of a Web3 aura-building lesson:

Tweet: "${tweetText}"
Lesson: "${lessonTitle}"

Check if the tweet:
1. Shows understanding of Web3 aura-building concepts from the lesson
2. Contains relevant insights about improving Web3 reputation
3. Demonstrates genuine learning about the topic
4. Appears authentic and thoughtful (not spam)

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
