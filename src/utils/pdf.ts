import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface PDFDetailItem {
    label: string;
    value: string;
}

export const exportImageToPdf = async (
    imageUri: string,
    title: string,
    details?: PDFDetailItem[]
) => {
    try {
        let base64Image = '';

        if (!imageUri) {
            Alert.alert('Error', 'No image available to export.');
            return;
        }

        if (imageUri.startsWith('http://') || imageUri.startsWith('https://') || imageUri.startsWith('data:')) {
            // Remote images and base64 data URIs can be referenced directly in the printing web context.
            base64Image = imageUri;
        } else {
            // Local files (file://, content://, etc.) need base64 conversion
            try {
                const base64 = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                const extension = imageUri.split('.').pop() || 'jpeg';
                base64Image = `data:image/${extension};base64,${base64}`;
            } catch (err) {
                console.warn('Failed to convert local image to base64, using raw URI', err);
                base64Image = imageUri;
            }
        }

        // Build details card markup
        const detailsHtml = details && details.length > 0
            ? `<div class="details-card">
                 ${details.map(d => `
                   <div class="detail-row">
                     <span class="detail-label">${d.label}</span>
                     <span class="detail-value">${d.value}</span>
                   </div>
                 `).join('')}
               </div>`
            : '';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        margin: 0;
                        padding: 40px;
                        background-color: #f8fafc;
                        color: #1e293b;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        box-sizing: border-box;
                    }
                    .container {
                        background-color: #ffffff;
                        border-radius: 24px;
                        padding: 40px;
                        width: 100%;
                        max-width: 500px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                        border: 1px solid #e2e8f0;
                        text-align: center;
                        box-sizing: border-box;
                    }
                    .header {
                        margin-bottom: 30px;
                    }
                    .app-logo {
                        font-size: 24px;
                        font-weight: 800;
                        color: #6366f1;
                        letter-spacing: 1px;
                        margin: 0;
                        text-transform: uppercase;
                    }
                    .app-subtitle {
                        font-size: 14px;
                        color: #64748b;
                        margin-top: 4px;
                        margin-bottom: 0;
                    }
                    .title {
                        font-size: 20px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-top: 0;
                        margin-bottom: 24px;
                    }
                    .image-container {
                        background-color: #ffffff;
                        border-radius: 16px;
                        padding: 16px;
                        display: inline-block;
                        border: 1px solid #e2e8f0;
                        margin-bottom: 30px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    }
                    .image-content {
                        width: 220px;
                        height: 220px;
                        object-fit: contain;
                        display: block;
                        margin: 0 auto;
                        border-radius: 12px;
                    }
                    .details-card {
                        background-color: #f1f5f9;
                        border-radius: 16px;
                        padding: 20px;
                        text-align: left;
                        margin-bottom: 20px;
                    }
                    .detail-row {
                        border-bottom: 1px solid #e2e8f0;
                        padding: 12px 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                        padding-bottom: 0;
                    }
                    .detail-row:first-child {
                        padding-top: 0;
                    }
                    .detail-label {
                        font-size: 11px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .detail-value {
                        font-size: 16px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .footer {
                        margin-top: 40px;
                        font-size: 12px;
                        color: #94a3b8;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1 class="app-logo">DRIVER-X</h1>
                        <p class="app-subtitle">Safe Drive, Happy Ride</p>
                    </div>
                    
                    <h2 class="title">${title}</h2>
                    
                    <div class="image-container">
                        <img class="image-content" src="${base64Image}" alt="PDF Document Image" />
                    </div>
                    
                    ${detailsHtml}
                    
                    <div class="footer">
                        Generated on ${new Date().toLocaleDateString()}
                    </div>
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: `Export ${title}`,
                UTI: 'com.adobe.pdf',
            });
        } else {
            Alert.alert('Sharing Unavailable', 'Sharing is not supported on this platform.');
        }
    } catch (error) {
        console.error('Failed to export PDF:', error);
        Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
};
