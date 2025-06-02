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
    const prompt = `Generate ${count} Web3 aura-building lessons specifically focused on improving one's reputation and standing in the Web3 ecosystem. Return JSON in this exact format:

{
  "lessons": [
    {
      "title": "Lesson title about building Web3 aura",
      "content": "Detailed lesson content focusing on aura-building strategies (3-4 paragraphs)",
      "keyTakeaways": ["aura-building takeaway 1", "aura-building takeaway 2", "aura-building takeaway 3"],
      "difficulty": "beginner|intermediate|advanced",
      "estimatedReadTime": 15
    }
  ]
}

Topics should focus on: DeFi yield strategies for reputation, NFT alpha hunting, DAO participation and leadership, crypto Twitter presence building, on-chain reputation systems, portfolio management for status, risk management that shows expertise, community building, networking in Web3, becoming a thought leader, and other strategies that enhance one's Web3 aura and credibility.`;

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
          content: "You are an expert quiz creator for Web3 aura-building lessons. Create engaging multiple-choice questions that test understanding and practical application of aura-building concepts."
        },
        {
          role: "user",
          content: `Based on this lesson about building Web3 aura:
          
          Title: "${lessonTitle}"
          Content: "${lessonContent}"
          
          Create a multiple-choice question that tests understanding of how to improve Web3 aura based on the lesson content. Focus on actionable strategies or key concepts.
          
          Respond in JSON format:
          {
            "question": "Based on the lesson you just read, which of the following will most improve your Web3 aura?",
            "options": ["option1", "option2", "option3", "option4"],
            "correctAnswer": 0,
            "explanation": "Brief explanation of why this answer is correct and how it builds aura"
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
