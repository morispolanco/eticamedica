// api/generate.js

// Importa 'node-fetch' si usas una versión de Node < 18, o usa el fetch nativo
// Si Vercel usa Node 18+ por defecto, el fetch global está disponible.
// Para mayor compatibilidad, podemos requerirlo explícitamente si es necesario.
// const fetch = require('node-fetch'); // Descomenta si usas Node < 18

export default async function handler(request, response) {
    // 1. Seguridad básica: Asegurarse de que sea una petición POST
    if (request.method !== 'POST') {
        response.setHeader('Allow', ['POST']);
        return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
    }

    // 2. Obtener la clave API de las variables de entorno
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
        console.error("Error: GOOGLE_GEMINI_API_KEY no está configurada en las variables de entorno.");
        return response.status(500).json({ error: "Error de configuración del servidor." });
    }

    // 3. Obtener el prompt del cuerpo de la solicitud del cliente
    const { prompt } = request.body;

    if (!prompt) {
        return response.status(400).json({ error: "El 'prompt' es requerido en el cuerpo de la solicitud." });
    }

    // 4. Construir la URL y el cuerpo para la API de Gemini
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
        },
        // safetySettings: [] // Ajusta según sea necesario
    };

    // 5. Llamar a la API de Gemini desde el servidor
    try {
        const geminiResponse = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const responseData = await geminiResponse.json();

        // 6. Manejar la respuesta de Gemini (éxito o error)
        if (!geminiResponse.ok) {
            console.error("Error desde la API de Gemini:", responseData);
            const errorMessage = responseData?.error?.message || `Error ${geminiResponse.status}`;
            // Devuelve el error de Gemini al cliente para más contexto
            return response.status(geminiResponse.status).json({ error: `Error de la API de Gemini: ${errorMessage}` });
        }

        // Extraer el texto generado
        if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content && responseData.candidates[0].content.parts && responseData.candidates[0].content.parts[0]) {
             const generatedText = responseData.candidates[0].content.parts[0].text;
             // 7. Enviar la respuesta exitosa al cliente
             return response.status(200).json({ result: generatedText });
        } else if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].finishReason === 'SAFETY') {
            return response.status(500).json({ error: "La respuesta de Gemini fue bloqueada por configuración de seguridad."});
        } else {
             console.error("Respuesta inesperada de Gemini:", responseData);
             return response.status(500).json({ error: "Formato de respuesta inesperado de la API de Gemini." });
        }

    } catch (error) {
        console.error("Error interno al llamar a la API de Gemini:", error);
        return response.status(500).json({ error: `Error interno del servidor: ${error.message}` });
    }
}
