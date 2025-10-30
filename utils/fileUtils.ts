
import { Part } from '@google/genai';

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // result is a data URL: "data:image/jpeg;base64,..."
        // We only want the base64 part
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
}

export async function fileToGenerativePart(file: File): Promise<Part> {
    const base64EncodedData = await fileToBase64(file);
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
}
