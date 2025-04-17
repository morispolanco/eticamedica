// --- CONFIGURACIÓN ---
// ¡¡¡IMPORTANTE!!! Reemplaza "TU_API_KEY_DE_GEMINI" con tu clave API real.
// Considera que exponer la clave API en el lado del cliente es un riesgo de seguridad.
// Para producción, usa un backend o funciones serverless para protegerla.
const API_KEY = "TU_API_KEY_DE_GEMINI";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`; // Usamos gemini-1.5-flash que es más rápido y económico

// --- REFERENCIAS A ELEMENTOS DEL DOM ---
const loadingDiv = document.getElementById('loading');
const loadingAnalysisDiv = document.getElementById('loading-analysis');
const dilemmaSectionDiv = document.getElementById('dilemma-section');
const caseTextP = document.getElementById('case-text');
const questionTextP = document.getElementById('question-text');
const optionsContainerDiv = document.getElementById('options-container');
const analysisSectionDiv = document.getElementById('analysis-section');
const analysisTextP = document.getElementById('analysis-text');
const newDilemmaButton = document.getElementById('new-dilemma-button');

// --- ESTADO DE LA APLICACIÓN ---
let currentDilemma = null; // Para guardar el dilema actual

// --- FUNCIONES ---

/**
 * Llama a la API de Gemini para generar contenido.
 * @param {string} prompt El prompt para enviar a la API.
 * @returns {Promise<string>} El texto generado por la API.
 * @throws {Error} Si la API devuelve un error o la respuesta no es válida.
 */
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                // Opciones adicionales para controlar la salida (opcional)
                generationConfig: {
                  temperature: 0.7, // Un poco de creatividad
                  // maxOutputTokens: 500 // Limita la longitud si es necesario
                },
                // safetySettings: [] // Puedes ajustar la configuración de seguridad si es necesario
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Error en la API:", errorBody);
            throw new Error(`Error de la API: ${response.statusText} - ${errorBody?.error?.message || 'Detalles no disponibles'}`);
        }

        const data = await response.json();

        // Verifica la estructura de la respuesta (puede variar ligeramente)
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
             return data.candidates[0].content.parts[0].text;
        } else if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
            throw new Error("La respuesta fue bloqueada por configuración de seguridad.");
        }
         else {
            console.error("Respuesta inesperada de la API:", data);
            throw new Error("Formato de respuesta inesperado de la API de Gemini.");
        }

    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        throw error; // Re-lanza el error para que sea manejado por la función que llama
    }
}

/**
 * Genera un nuevo dilema ético médico usando la API.
 */
async function generateDilemma() {
    console.log("Generando dilema...");
    setLoadingState(true);
    analysisSectionDiv.style.display = 'none'; // Oculta análisis anterior
    dilemmaSectionDiv.style.display = 'none'; // Oculta dilema mientras carga
    optionsContainerDiv.innerHTML = ''; // Limpia opciones anteriores

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
        const responseText = await callGeminiAPI(prompt);
        console.log("Respuesta cruda de la API (dilema):", responseText);

        // Intenta parsear la respuesta JSON (puede estar dentro de ```json ... ```)
        let dilemmaData;
        try {
            // Extraer JSON si está dentro de bloques de código
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : responseText;
            dilemmaData = JSON.parse(jsonString.trim());
        } catch (parseError) {
            console.error("Error al parsear JSON del dilema:", parseError, "Respuesta recibida:", responseText);
            throw new Error("La API no devolvió un JSON válido para el dilema.");
        }


        if (!dilemmaData || !dilemmaData.case || !dilemmaData.question || !dilemmaData.options || !Array.isArray(dilemmaData.options)) {
             console.error("JSON parseado incompleto:", dilemmaData);
            throw new Error("El JSON del dilema recibido no tiene la estructura esperada.");
        }

        currentDilemma = dilemmaData; // Guarda el dilema actual
        displayDilemma(currentDilemma);

    } catch (error) {
        console.error("Error generando dilema:", error);
        caseTextP.textContent = `Error al generar el dilema: ${error.message}. Intenta de nuevo.`;
        questionTextP.textContent = '';
        optionsContainerDiv.innerHTML = '';
        // Ofrecer botón para reintentar directamente
        optionsContainerDiv.innerHTML = '<button id="retry-dilemma-button">Reintentar Generar Dilema</button>';
        document.getElementById('retry-dilemma-button').addEventListener('click', generateDilemma);


    } finally {
        setLoadingState(false);
        dilemmaSectionDiv.style.display = 'block'; // Muestra la sección del dilema (incluso si hay error)
    }
}


/**
 * Muestra el dilema en la interfaz de usuario.
 * @param {object} dilemmaData Objeto con case, question y options.
 */
function displayDilemma(dilemmaData) {
    caseTextP.textContent = dilemmaData.case;
    questionTextP.textContent = dilemmaData.question;
    optionsContainerDiv.innerHTML = ''; // Limpia opciones anteriores

    dilemmaData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        button.dataset.optionIndex = index; // Guardamos el índice por si acaso
        button.addEventListener('click', handleOptionClick);
        optionsContainerDiv.appendChild(button);
    });
}

/**
 * Maneja el clic en un botón de opción.
 * @param {Event} event El evento de clic.
 */
function handleOptionClick(event) {
    const chosenOptionText = event.target.textContent;
    console.log("Opción elegida:", chosenOptionText);

    // Deshabilitar todos los botones de opción
    const optionButtons = optionsContainerDiv.querySelectorAll('.option-button');
    optionButtons.forEach(btn => btn.disabled = true);

    getAnalysis(currentDilemma, chosenOptionText);
}


/**
 * Obtiene el análisis de la opción elegida usando la API.
 * @param {object} dilemma El dilema completo (case, question, options).
 * @param {string} chosenOption La opción textual elegida por el usuario.
 */
async function getAnalysis(dilemma, chosenOption) {
    console.log("Obteniendo análisis...");
    setLoadingAnalysisState(true);
    analysisSectionDiv.style.display = 'block'; // Muestra la sección de análisis
    analysisTextP.textContent = ''; // Limpia análisis anterior

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

        Ejemplo de inicio de análisis (NO uses este ejemplo exacto): "Esta elección parece priorizar el principio de autonomía del paciente..." o "Optar por esta vía puede llevar a un resultado potencialmente beneficioso para..."
    `;

    try {
        const analysisResult = await callGeminiAPI(prompt);
        console.log("Respuesta cruda de la API (análisis):", analysisResult);
        displayAnalysis(analysisResult);
    } catch (error) {
        console.error("Error obteniendo análisis:", error);
        analysisTextP.textContent = `Error al obtener el análisis: ${error.message}. Puedes generar un nuevo dilema si lo deseas.`;
    } finally {
         setLoadingAnalysisState(false);
    }
}


/**
 * Muestra el análisis en la interfaz.
 * @param {string} analysis El texto del análisis.
 */
function displayAnalysis(analysis) {
    analysisTextP.innerHTML = analysis.replace(/\n/g, '<br>'); // Reemplaza saltos de línea para HTML
}

/**
 * Controla la visibilidad del indicador de carga principal.
 * @param {boolean} isLoading True para mostrar, false para ocultar.
 */
function setLoadingState(isLoading) {
    loadingDiv.style.display = isLoading ? 'flex' : 'none';
}

/**
 * Controla la visibilidad del indicador de carga del análisis.
 * @param {boolean} isLoading True para mostrar, false para ocultar.
 */
function setLoadingAnalysisState(isLoading) {
    loadingAnalysisDiv.style.display = isLoading ? 'flex' : 'none';
    // Opcional: deshabilitar botón de nuevo dilema mientras analiza
    // newDilemmaButton.disabled = isLoading;
}

// --- INICIALIZACIÓN ---
newDilemmaButton.addEventListener('click', generateDilemma);

// Generar el primer dilema al cargar la página
window.addEventListener('load', generateDilemma);
