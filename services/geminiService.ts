
import { GoogleGenAI, Modality, Part, Content, Type } from "@google/genai";
import { ChatMessage, QuizQuestion } from "../types";

// Cache the client instance to avoid re-creating it on every call.
let ai: GoogleGenAI | null = null;

/**
 * Lazily initializes and returns the GoogleGenAI client instance.
 * This prevents the app from crashing on startup if the API key is not configured.
 * @returns {GoogleGenAI} The initialized AI client.
 * @throws {Error} If the API key is missing.
 */
const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API key is not configured. Please ensure the API_KEY environment variable is set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};


export const processDocument = async (content: string, mimeType: string): Promise<string> => {
  const modelName = 'gemini-2.5-flash';
  const aiClient = getAiClient();
  
  const parts: Part[] = [];
  if (mimeType.startsWith('image/')) {
    parts.push({
      inlineData: {
        data: content,
        mimeType: mimeType,
      },
    });
    parts.push({ text: "You are an AI Study Buddy. Concisely summarize the key information from this image. This summary will be used as the context for a user to ask questions. Focus on extracting factual information, key terms, and main concepts." });
  } else {
    parts.push({ text: `You are an AI Study Buddy. Concisely summarize the key information from the following text. This summary will be used as the context for a user to ask questions. Focus on extracting factual information, key terms, and main concepts. Text: """${content}"""` });
  }

  const result = await aiClient.models.generateContent({ model: modelName, contents: [{ parts }] });
  return result.text;
};


export const getChatResponseStream = async (context: string, question: string, history: ChatMessage[]) => {
    const modelName = 'gemini-2.5-flash';
    const aiClient = getAiClient();

    const fullHistory: Content[] = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));

    // The API requires conversations to start with a 'user' role.
    // Our UI adds an initial 'model' message for context, so we must filter it out
    // before sending the history to the API to ensure the conversation is valid.
    const filteredHistory = fullHistory.filter((msg, index) => {
      const isNotEmpty = msg.parts[0].text?.trim() !== '';
      const isNotInitialModelMessage = !(index === 0 && msg.role === 'model');
      return isNotEmpty && isNotInitialModelMessage;
    });

    // We only take the last 6 messages to keep the context small
    const recentHistory = filteredHistory.slice(-6);

    // RAG Pattern: Combine the context and question in the final user message for reliability.
    const userPrompt = `Based on the provided document summary, please answer the following question.

**DOCUMENT SUMMARY:**
"""
${context}
"""

**QUESTION:**
${question}`;

    const stream = await aiClient.models.generateContentStream({
        model: modelName,
        contents: [...recentHistory, { role: 'user', parts: [{ text: userPrompt }] }],
        config: {
            // System instruction now focuses on the persona and rules, as context is in the prompt.
            systemInstruction: `You are an expert AI Study Buddy.
            
            **RULES:**
            1.  Base all your answers strictly on the information given in the user's prompt which contains the document summary.
            2.  Do not use any external knowledge or information.
            3.  If the answer cannot be found in the document summary, you MUST explicitly say: "I cannot answer that based on the provided document."
            4.  Keep your answers concise and to the point.
            `,
        }
    });

    return stream;
};

export const generateSpeech = async (text: string): Promise<string> => {
  const modelName = 'gemini-2.5-flash-preview-tts';
  const aiClient = getAiClient();
  
  const response = await aiClient.models.generateContent({
    model: modelName,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64Audio) {
    throw new Error("No audio data received from API.");
  }

  return base64Audio;
};

export const generateQuiz = async (fullDocumentContent: string): Promise<QuizQuestion[]> => {
  const modelName = 'gemini-2.5-flash';
  const aiClient = getAiClient();
  const prompt = `Based on the following document content, generate a 10-question multiple-choice quiz to test understanding. Each question must have exactly 4 options. One of the options must be the correct answer.

  **DOCUMENT CONTENT:**
  """
  ${fullDocumentContent}
  """`;

  const response = await aiClient.models.generateContent({
    model: modelName,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        description: "A list of 10 multiple-choice quiz questions.",
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "The quiz question."
            },
            options: {
              type: Type.ARRAY,
              description: "A list of exactly 4 potential answers.",
              items: {
                type: Type.STRING
              }
            },
            answer: {
              type: Type.STRING,
              description: "The correct answer, which must be one of the provided options."
            }
          },
          required: ["question", "options", "answer"]
        }
      }
    }
  });

  try {
    const quizData = JSON.parse(response.text);
    if (!Array.isArray(quizData) || quizData.length === 0) {
      throw new Error("Generated quiz data is not a valid array.");
    }
    return quizData as QuizQuestion[];
  } catch (e) {
    console.error("Failed to parse quiz JSON:", e);
    throw new Error("Could not generate a valid quiz from the document.");
  }
};
