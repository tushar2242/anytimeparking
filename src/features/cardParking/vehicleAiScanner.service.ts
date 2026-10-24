import * as FileSystem from 'expo-file-system';
import Api, { baseURL } from '@/src/Api/api';

export interface VehicleDetectionResult {
    licensePlate: string;
    brand: string;
    model: string;
    color: string;
    vehicleType?: string;
    confidence?: number;
    rawText?: string;
}

/**
 * Scan vehicle photo using backend endpoint /api/v1/vehicle/scan (powered by GeminiVisionService)
 * and fallback to direct Google Gemini Vision API if needed.
 */
export async function scanVehicleWithAI(imageUri: string): Promise<VehicleDetectionResult> {
    const result: VehicleDetectionResult = {
        licensePlate: '',
        brand: '',
        model: '',
        color: '',
        vehicleType: '',
    };

    // 1. Primary: Use backend /api/v1/vehicle/scan endpoint
    try {
        const formData = new FormData();
        const uriParts = imageUri.split('/');
        const fileName = uriParts[uriParts.length - 1] || 'vehicle_scan.jpg';

        formData.append('image', {
            uri: imageUri,
            name: fileName,
            type: 'image/jpeg',
        } as any);

        // Primary endpoint is /api/v1/vehicle/scan
        const response: any = await Api.post('/api/v1/vehicle/scan', formData, {
            formData: true,
        }).catch(async (e: any) => {
            // Fallback try /vehicle/scan in case proxy rewrites prefix
            return await Api.post('/vehicle/scan', formData, {
                formData: true,
            });
        });

        const data = response?.data || response;
        if (data) {
            const plateObj = data.license_plate || {};
            const attrs = data.vehicle_attributes || {};

            const detectedPlate =
                plateObj.normalized_plate ||
                plateObj.formatted_plate ||
                plateObj.raw_text ||
                '';

            let make = '';
            let model = '';
            const makeModelStr = attrs.make_model || '';
            if (makeModelStr && makeModelStr !== 'UNKNOWN') {
                const parts = makeModelStr.trim().split(' ');
                make = parts[0] || '';
                model = parts.slice(1).join(' ') || '';
            }

            let colorStr = attrs.color || '';
            if (colorStr === 'UNKNOWN') colorStr = '';

            let vehicleTypeStr = attrs.body_type || '';
            if (vehicleTypeStr === 'UNKNOWN') vehicleTypeStr = '';

            result.licensePlate = detectedPlate.toUpperCase().trim();
            result.brand = make;
            result.model = model;
            result.color = colorStr ? colorStr.charAt(0).toUpperCase() + colorStr.slice(1).toLowerCase() : '';
            result.vehicleType = vehicleTypeStr;
            result.confidence = plateObj.ocr_confidence || attrs.classification_confidence || 0.9;
            result.rawText = plateObj.raw_text;

            if (result.licensePlate || result.brand || result.color) {
                return result;
            }
        }
    } catch (backendErr) {
        console.warn('Backend vehicle/scan failed, attempting direct Gemini fallback...', backendErr);
    }

    // 2. Direct Gemini Vision API fallback
    const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) {
        return result;
    }

    try {
        const base64Data = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
        const prompt = `You are an AI specialized in vehicle inspection and license plate recognition for a smart valet system. 
Analyze the given image carefully and extract the following details in pure JSON:
{
  "license_plate": "<clean alphanumeric registration number in uppercase, or empty string>",
  "brand": "<vehicle make/manufacturer e.g. Toyota, Honda, Hyundai, BMW, Mercedes-Benz, Tata, Maruti Suzuki, etc., or empty string>",
  "model": "<specific model e.g. Civic, Fortuner, Creta, 3 Series, etc., or empty string>",
  "color": "<dominant vehicle color e.g. White, Black, Silver, Grey, Red, Blue, etc., or empty string>",
  "vehicle_type": "<SEDAN, SUV, HATCHBACK, VAN, TRUCK, MOTORCYCLE, etc.>"
}
Respond ONLY with raw valid JSON without markdown formatting.`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType,
                                        data: base64Data,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0.1,
                    },
                }),
            }
        );

        if (geminiRes.ok) {
            const gData = await geminiRes.json();
            const textContent = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textContent) {
                const cleaned = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleaned);
                return {
                    licensePlate: (parsed.license_plate || '').toUpperCase().trim(),
                    brand: (parsed.brand || '').trim(),
                    model: (parsed.model || '').trim(),
                    color: (parsed.color || '').trim(),
                    vehicleType: (parsed.vehicle_type || '').trim(),
                };
            }
        }
    } catch (directErr) {
        console.warn('Direct Gemini fallback failed:', directErr);
    }

    return result;
}
