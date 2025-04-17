// --- CONFIGURACIÓN ---
// Ya no necesitamos la API_KEY aquí.
// La URL ahora apunta a nuestra propia función serverless.
const API_ENDPOINT = '/api/generate'; // URL relativa a nuestra función Vercel

// --- REFERENCIAS A ELEMENTOS DEL DOM --- (Sin cambios)
const loadingDiv = document.getElementById('loading');
const loadingAnalysisDiv = document.getElementById('loading-analysis');
const dilemmaSectionDiv = document.getElementById('dilemma-section');
const caseTextP = document.getElementById('case-text');
const questionTextP = document.getElementById('question-text');
const optionsContainerDiv = document.getElementById('options-container');
const analysisSectionDiv = document.getElementById('analysis-section');
const analysisTextP = document.getElementById('analysis-text');
const newDilemmaButton = document.getElementById('new-dilemma-button');

// --- ESTADO DE LA APLICACIÓN --- (Sin cambios)
let currentDilemma = null;

// --- FUNCIONES ---

/**
 * Llama a nuestra API backend (Serverless Function) para generar contenido.
 * @param {string} prompt El prompt para enviar a nuestra API.
 * @returns {Promise<string>} El texto generado por la API de Gemini (vía nuestro backend).
 * @throws {Error} Si nuestra API backend devuelve un error.
 */
async function callBackendAPI(prompt) {
    try {
        const response = await fetch(API_ENDPOINT, { // Llama a nuestra función /api/generate
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }), // Envía el prompt en el cuerpo
        });

        const data = await response.json(); // Parsea la respuesta de nuestra función

        if (!response.ok) {
            // Si la respuesta no fue exitosa, data contendrá { error: "mensaje" }
            console.error("Error desde el backend:", data.error);
            throw new Error(data.error || `Error del servidor: ${response.statusText}`);
        }

        // Si fue exitosa, data contendrá { result: "texto generado" }
        return data.result;

    } catch (error) {
        console.error("Error al llamar al endpoint del backend:", error);
        // Si fetch falla (ej. red), o JSON parse falla, o lanzamos error arriba
        throw error; // Re-lanza el error para que sea manejado
    }
}

/**
 * Genera un nuevo dilema ético médico usando nuestra API backend.
 */
async function generateDilemma() {
    console.log("Generando dilema...");
    setLoadingState(true);
    analysisSectionDiv.style.display = 'none';
    dilemmaSectionDiv.style.display = 'none';
    optionsContainerDiv.innerHTML = '';

    // El prompt para Gemini sigue siendo el mismo
    const prompt = `
        Genera un dilema ético complejo y realista en el área de la medicina.
        El resultado debe ser un objeto JSON válido con las siguientes claves:
        - "case": Una descripción concisa del caso (máximo 150 palabras).
        - "question": Una pregunta ética clara y directa relacionada con el caso.
        - "options": Un array de 3 o 4 strings, cada uno representando una opción de acción distinta frente al dilema. Las opciones deben reflejar diferentes posturas éticas (ej: deontológica, utilitarista, ética del cuidado, etc.) sin etiquetarlas explícitamente.

        Ejemplo de formato de salida esperado (NO uses este ejemplo exacto):
        {
          "case": "Un paciente anciano con demencia avanzada necesita una cirugía mayor con baja probabilidad de éxito y alto riesgo de complicaciones postoperatorias que disminuirían aún más su calidad de vida. La familia está dividida sobre si proceder.",
          "question": "¿Qué curso de acción debería recomendar el equipo médico?",
          "options": [
            "Recomendar la cirugía, respetando cualquier directiva anticipada o deseo previo del paciente, si existe.",
            "Priorizar la calidad de vida actual y futura, recomendando cuidados paliativos en lugar de la cirugía.",
            "Presentar objetivamente los riesgos y beneficios a la familia y dejar que ellos tomen la decisión final.",
            "Consultar al comité de ética del hospital para obtener una recomendación basada en un análisis más profundo."
          ]
        }

        Asegúrate de que el JSON sea válido y esté bien formado. No incluyas nada antes o después del objeto JSON.
    `;

    try {
        // Llama a nuestra función backend en lugar de directamente a Gemini
        const responseText = await callBackendAPI(prompt);
        console.log("Respuesta recibida del backend (dilema):", responseText);

        let dilemmaData;
        try {
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : responseText;
            dilemmaData = JSON.parse(jsonString.trim());
        } catch (parseError) {
            console.error("Error al parsear JSON del dilema:", parseError, "Respuesta recibida:", responseText);
            // Añade el error original si existe en la respuesta del backend
            throw new Error(`La respuesta del backend no contenía un JSON válido para el dilema.`);
        }

        if (!dilemmaData || !dilemmaData.case || !dilemmaData.question || !dilemmaData.options || !Array.isArray(dilemmaData.options)) {
            console.error("JSON parseado incompleto:", dilemmaData);
            throw new Error("El JSON del dilema recibido no tiene la estructura esperada.");
        }

        currentDilemma = dilemmaData;
        displayDilemma(currentDilemma);

    } catch (error) {
        console.error("Error generando dilema:", error);
        // Muestra el mensaje de error recibido del backend o del parseo
        caseTextP.textContent = `Error al generar el dilema: ${error.message}. Intenta de nuevo.`;
        questionTextP.textContent = '';
        optionsContainerDiv.innerHTML = '<button id="retry-dilemma-button">Reintentar Generar Dilema</button>';
        const retryButton = document.getElementById('retry-dilemma-button');
        if (retryButton) { // Asegurarse que el botón existe antes de añadir listener
           retryButton.addEventListener('click', generateDilemma);
        }

    } finally {
        setLoadingState(false);
        dilemmaSectionDiv.style.display = 'block';
    }
}

// --- displayDilemma --- (Sin cambios)
function displayDilemma(dilemmaData) {
    caseTextP.textContent = dilemmaData.case;
    questionTextP.textContent = dilemmaData.question;
    optionsContainerDiv.innerHTML = '';

    dilemmaData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.dataset.optionIndex = index;
        button.addEventListener('click', handleOptionClick);
        optionsContainerDiv.appendChild(button);
    });
}


// --- handleOptionClick --- (Sin cambios)
function handleOptionClick(event) {
    const chosenOptionText = event.target.textContent;
    console.log("Opción elegida:", chosenOptionText);

    const optionButtons = optionsContainerDiv.querySelectorAll('.option-button');
    optionButtons.forEach(btn => btn.disabled = true);

    getAnalysis(currentDilemma, chosenOptionText);
}

/**
 * Obtiene el análisis de la opción elegida usando nuestra API backend.
 * @param {object} dilemma El dilema completo.
 * @param {string} chosenOption La opción textual elegida.
 */
async function getAnalysis(dilemma, chosenOption) {
    console.log("Obteniendo análisis...");
    setLoadingAnalysisState(true);
    analysisSectionDiv.style.display = 'block';
    analysisTextP.textContent = '';

    // El prompt para el análisis sigue siendo el mismo
    const prompt = `
        Contexto: Se presentó el siguiente dilema ético médico:
        Caso: ${dilemma.case}
        Pregunta: ${dilemma.question}
        Opciones presentadas:
        ${dilemma.options.map((opt, i) => `- Opción ${i + 1}: ${opt}`).join('\n')}

        El usuario eligió la siguiente opción: "${chosenOption}"

        Tarea: Proporciona un análisis conciso (máximo 200 palabras) de la elección del usuario.
        Enfócate en:
        1.  Los posibles principios éticos que podrían sustentar esta elección (ej., autonomía, beneficencia, no maleficencia, justicia, utilitarismo, ética del cuidado). Menciona brevemente el principio si aplica.
        2.  Las posibles consecuencias positivas y negativas (trade-offs) de seguir este curso de acción en el mundo real.
        3.  Evita emitir juicios de valor sobre si la elección es "correcta" o "incorrecta". Sé descriptivo y analítico.
        4.  El lenguaje debe ser claro y accesible para alguien no experto en ética médica.
        5.  No repitas la opción elegida al inicio del análisis. Empieza directamente con el análisis.
    `;

    try {
        // Llama a nuestra función backend para obtener el análisis
        const analysisResult = await callBackendAPI(prompt);
        console.log("Respuesta recibida del backend (análisis):", analysisResult);
        displayAnalysis(analysisResult);
    } catch (error) {
        console.error("Error obteniendo análisis:", error);
        // Muestra el mensaje de error devuelto por nuestro backend
        analysisTextP.textContent = `Error al obtener el análisis: ${error.message}. Puedes generar un nuevo dilema.`;
    } finally {
         setLoadingAnalysisState(false);
    }
}

// --- displayAnalysis --- (Sin cambios)
function displayAnalysis(analysis) {
    analysisTextP.innerHTML = analysis.replace(/\n/g, '<br>');
}

// --- setLoadingState --- (Sin cambios)
function setLoadingState(isLoading) {
    loadingDiv.style.display = isLoading ? 'flex' : 'none';
}

// --- setLoadingAnalysisState --- (Sin cambios)
function setLoadingAnalysisState(isLoading) {
    loadingAnalysisDiv.style.display = isLoading ? 'flex' : 'none';
}

// --- INICIALIZACIÓN --- (Sin cambios)
newDilemmaButton.addEventListener('click', generateDilemma);
window.addEventListener('load', generateDilemma);
