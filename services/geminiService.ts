
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { Message, ProjectGist } from "../types";

const TEXT_MODEL = 'gemini-3-pro-preview';
const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  getLiveClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async chat(history: Message[], userInput: string, imageUrl?: string): Promise<string> {
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const currentParts: any[] = [{ text: userInput }];
    if (imageUrl) {
      const base64Data = imageUrl.split(',')[1];
      const mimeType = imageUrl.split(',')[0].split(':')[1].split(';')[0];
      currentParts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const response = await this.ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [
        ...contents,
        { role: 'user', parts: currentParts }
      ],
      config: {
        systemInstruction: "You are 'Lumina Assistant', a high-end acquisitions editor at Lumina Publishing. You help authors develop their manuscripts, provide artistic feedback on cover concepts, and advise on marketability. Be professional, encouraging, and sophisticated. Use elegant language. Your goal is to guide them toward a successful publication proposal.",
      }
    });

    return response.text || "I apologize, I couldn't process that request.";
  }

  async analyzeImage(imageDataUrl: string): Promise<string> {
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];

    const response = await this.ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "As an expert book cover designer and editor, analyze this image. Is it suitable for a book cover? What genre does it suggest? Provide specific feedback on composition, mood, and marketability." }
        ]
      }]
    });

    return response.text || "Image analysis failed.";
  }

  async extractGist(history: Message[]): Promise<ProjectGist> {
    const conversation = history.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    
    const response = await this.ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{
        parts: [{ text: `Based on the following conversation with an author, extract the details of their project into a structured format. Return only JSON.\n\nConversation:\n${conversation}` }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            genre: { type: Type.STRING },
            summary: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            wordCount: { type: Type.STRING },
            authorNote: { type: Type.STRING }
          },
          required: ["title", "genre", "summary", "targetAudience", "wordCount", "authorNote"]
        }
      }
    });

    try {
      return JSON.parse(response.text || '{}') as ProjectGist;
    } catch (e) {
      return {
        title: "Untitled Project",
        genre: "Unknown",
        summary: "Could not extract summary.",
        targetAudience: "General",
        wordCount: "Unknown",
        authorNote: "Extracted during consultation."
      };
    }
  }

  // Audio Utilities
  encodeAudio(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  decodeAudio(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const geminiService = new GeminiService();
