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
    const prompt = `Generate ${count} comprehensive Web3 aura-building lesson that teaches users practical strategies for building their reputation and credibility in the Web3 space. Return JSON in this exact format:

{
  "lessons": [
    {
      "title": "Clear, educational title about building Web3 aura/reputation",
      "content": "3-4 detailed paragraphs that actually teach something valuable. Include:\n- Specific strategies and tactics\n- Real examples and case studies\n- Step-by-step guidance\n- Common mistakes to avoid\n- Practical tips users can implement immediately\nMake this educational content that users will genuinely learn from and want to share.",
      "keyTakeaways": ["specific actionable insight 1", "specific actionable insight 2", "specific actionable insight 3", "specific actionable insight 4"],
      "difficulty": "intermediate",
      "estimatedReadTime": 15
    }
  ]
}

Focus on topics like: Building authentic relationships in Web3 communities, Creating valuable content that establishes expertise, Networking strategies for Web3 professionals, Building trust through consistent helpful actions, Developing thought leadership in crypto spaces, Supporting others to build your own reputation, or Long-term reputation building strategies. Make each lesson genuinely educational and valuable.`;

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
    const prompt = `Create a comprehensive Web3 aura-building lesson about: "${topic}". Return JSON in this exact format:

{
  "title": "Educational title that clearly explains what the lesson teaches",
  "content": "4-5 detailed paragraphs that provide genuine educational value. Include:\n- Clear explanations of concepts\n- Specific examples and real-world applications\n- Step-by-step strategies users can follow\n- Common pitfalls and how to avoid them\n- Concrete actions readers can take immediately\n- Why these strategies work for building Web3 reputation\nMake this content that users will actually learn from and find valuable enough to share.",
  "keyTakeaways": ["specific actionable strategy 1", "specific actionable strategy 2", "specific actionable strategy 3", "specific actionable strategy 4"],
  "difficulty": "intermediate",
  "estimatedReadTime": 15
}

Focus on practical reputation-building strategies in the Web3 space. Make this educational content that teaches real skills and knowledge.`;

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
          content: "You are an expert quiz creator for Web3 aura-building lessons. Create engaging multiple-choice questions that test understanding of what builds vs what reduces Web3 aura and reputation."
        },
        {
          role: "user",
          content: `Based on this lesson about building Web3 aura:
          
          Title: "${lessonTitle}"
          Content: "${lessonContent}"
          
          Create an engaging multiple-choice question about Web3 aura building. Use one of these question formats:
          
          1. "Which of the following actions will INCREASE your Web3 aura?"
          2. "Which of the following behaviors will DECREASE your Web3 aura?"
          3. "Which approach is BEST for building long-term Web3 reputation?"
          4. "Which mistake should you AVOID when building Web3 aura?"
          
          Include 4 options: 3 wrong answers and 1 correct answer. Make the options realistic scenarios that Web3 users actually face.
          
          Respond in JSON format:
          {
            "question": "Your chosen question with clear wording",
            "options": ["option 1", "option 2", "option 3", "option 4"],
            "correctAnswer": 0,
            "explanation": "Clear explanation of why the correct answer builds/protects aura and why the wrong options reduce aura or credibility"
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
