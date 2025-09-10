// src/api/gemini.ts
import { GEMINI_API } from "@env";
import {
  GoogleGenAI,
  Content,
  Modality,
  ContentListUnion,
  GenerateContentResponse,
} from "@google/genai";
import { base64L16ToWavDataUri } from "../utilities/wav";
const ai = new GoogleGenAI({ apiKey: GEMINI_API });

export const sendMessageStream = async (
  model: string,
  userMessage: string,
  maxOutputTokens: number | undefined,
  history: Content[] | undefined,
  temperature: number = 0.1,
  systemInstruction: string[] | undefined
): Promise<string> => {
  try {
    const chunks = [];
    const chat = ai.chats.create({
      model: model,
      config: {
        maxOutputTokens: maxOutputTokens,
        responseMimeType: "text/plain",
        temperature: temperature,
        systemInstruction: systemInstruction,
      },
      history: history,
    });
    const stream1 = await chat.sendMessageStream({
      message: userMessage,
    });
    for await (const chunk of stream1) {
      if (chunk.usageMetadata?.candidatesTokensDetails) {
        console.log("chunk?.usageMetadata: ", chunk?.usageMetadata);
        console.log("-------------------------");
      }
      chunks.push(chunk.text);
    }

    return chunks.join("");
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Lỗi khi gọi Gemini API.";
  }
};

export const generateContent = async (
  model: string,
  userMessage: string,
  image?: string
): Promise<[string, string]> => {
  try {
    let contents: ContentListUnion = userMessage;
    if (image) {
      const base64Only = image.replace(/^data:image\/\w+;base64,/, "");
      contents = [
        { text: userMessage },
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Only,
          },
        },
      ];
    }
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const texts: string[] = [];
    let imageData: string = "";
    const outputParts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of outputParts) {
      if (part.text) {
        texts.push(part.text);
      } else if (part.inlineData) {
        const base64 = part.inlineData.data;
        imageData = `data:image/png;base64,${base64}`;
      }
    }

    if (response.usageMetadata?.candidatesTokensDetails) {
      console.log("response?.usageMetadata: ", response?.usageMetadata);
      console.log("-------------------------");
    }

    return [texts.join(""), imageData];
  } catch (error) {
    console.error("Gemini API error:", error);
    return ["Lỗi khi gọi Gemini API.", ""];
  }
};

export const generatedImage = async (
  model: string,
  prompt: string,
  numberOfImages: number = 4
): Promise<string[]> => {
  const base64Imgs = [];
  try {
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: {
        numberOfImages: numberOfImages,
      },
    });

    const images = response.generatedImages;
    if (!images || images.length === 0) {
      throw new Error("No images generated.");
    }

    for (const img of images) {
      if (img?.image?.imageBytes) {
        const base64 = img.image?.imageBytes;
        base64Imgs.push(`data:image/png;base64,${base64}`);
      }
    }

    return base64Imgs;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Error!");
  }
};

export const generateSpeech = async (
  text: string,
  instruction: string = "Reading bussiness book"
): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `${instruction}:${text}` }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64L16 =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (response.usageMetadata?.candidatesTokensDetails) {
    console.log("text?.length: ", text?.length);
    console.log("response?.usageMetadata: ", response?.usageMetadata);
    console.log("-------------------------");
  }
  return base64L16ToWavDataUri(base64L16 || "");
};
