import { GoogleGenAI, Type } from "@google/genai";
import { DiagramNode, DiagramEdge } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTeachingContent = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Explain the concept of "${topic}" clearly and concisely for a YouTube educational video. Keep it under 150 words.`,
    });
    return response.text || "Could not generate explanation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI Assistant.";
  }
};

export const generateDiagramFromText = async (prompt: string): Promise<{ nodes: DiagramNode[], edges: DiagramEdge[] } | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a system design or flowchart diagram for: "${prompt}". 
      Return a JSON object with 'nodes' (id, type [rect/circle/diamond], label, x, y) and 'edges' (from, to). 
      Keep x/y coordinates in a 800x600 range. 
      Limit to 5-8 nodes.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  label: { type: Type.STRING },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                },
                required: ["id", "type", "label", "x", "y"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  from: { type: Type.STRING },
                  to: { type: Type.STRING },
                },
                required: ["from", "to"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    
    const data = JSON.parse(jsonText);
    
    // Post-process to add default dimensions and colors
    const nodes = data.nodes.map((n: any) => ({
      ...n,
      width: 140,
      height: 60,
      color: '#1e293b',
      data: {}
    }));
    
    const edges = data.edges.map((e: any, i: number) => ({
      id: `edge-${i}-${Date.now()}`,
      from: e.from,
      to: e.to
    }));

    return { nodes, edges };

  } catch (error) {
    console.error("Gemini Diagram Error:", error);
    return null;
  }
};
