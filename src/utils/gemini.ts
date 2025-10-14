import { GoogleGenerativeAI } from "@google/generative-ai";

// ✅ Replace with your Gemini API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const generateQuiz = async (topic: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Generate a 5-item multiple-choice quiz about "${topic}".
      Format it as a JSON array like this:
      [
        {
          "question": "...",
          "choices": ["A", "B", "C", "D"],
          "answer": "B"
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Try to parse JSON
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]") + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
