// En script.js

// --- CONFIGURACIÓN ---
const API_ENDPOINT = '/api/generate';

// *** NUEVO: Lista de áreas éticas ***
const ethicalAreas = [
    "Embarazo y reproducción (ej. aborto, fertilización in vitro)",
    "Prescripción de medicamentos (ej. uso de opioides, sobremedicación)",
    "Conflicto de intereses (ej. relaciones con farmacéuticas)",
    "Consentimiento informado (ej. procedimientos experimentales, capacidad del paciente)",
    "Final de la vida (ej. eutanasia, cuidados paliativos, órdenes de no resucitar)",
    "Investigación médica (ej. ensayos clínicos, uso de placebos, ética en poblaciones vulnerables)",
    "Privacidad y confidencialidad (ej. manejo de datos de pacientes, historiales electrónicos)",
    "Asignación de recursos (ej. distribución de órganos para trasplantes, camas UCI, acceso a medicamentos caros)",
    "Tratamiento de menores (ej. consentimiento parental vs. autonomía del menor)",
    "Salud mental (ej. internamiento involuntario, estigma, confidencialidad)",
    "Genética y edición genética (ej. CRISPR, pruebas genéticas predictivas, privacidad genética)",
    "Acceso a la atención médica (ej. desigualdades socioeconómicas, barreras geográficas, seguros)",
    "Relaciones médico-paciente (ej. límites profesionales, comunicación, confianza)",
    "Errores médicos y negligencia (ej. revelación de errores, cultura de seguridad)",
    "Publicidad y marketing médico (ej. promoción de tratamientos, información engañosa)",
    "Donación y trasplante de órganos (ej. criterios de asignación, donantes vivos, mercado negro)",
    "Inteligencia artificial en medicina (ej. diagnóstico algorítmico, sesgos, responsabilidad)",
    "Telemedicina (ej. calidad de atención remota, brecha digital, privacidad)",
    "Vacunación (ej. obligatoriedad, desinformación, dudas sobre vacunas)",
    "Transfusiones de sangre y derivados (ej. objeciones religiosas, seguridad)",
    "Cirugía (ej. estética vs. reconstructiva, consentimiento para procedimientos complejos)",
    "Discriminación en la atención (ej. sesgos raciales, de género, edad, orientación sexual)",
    "Uso de tecnologías emergentes (ej. neuroimplantes, monitorización continua)",
    "Salud pública y políticas (ej. cuarentenas, rastreo de contactos, priorización en pandemias)",
    "Ética del cuidado (ej. enfoque en relaciones y contexto vs. principios abstractos)"
];


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

// --- callBackendAPI --- (Sin cambios)
async function callBackendAPI(prompt) {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt }),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error("Error desde el backend:", data.error);
            throw new Error(data.error || `Error del servidor: ${response.statusText}`);
        }
        return data.result;
    } catch (error) {
        console.error("Error al llamar al endpoint del backend:", error);
        throw error;
    }
}


/**
 * Genera un nuevo dilema ético médico usando nuestra API backend,
 * enfocándose en un área temática seleccionada aleatoriamente.
 */
async function generateDilemma() {
    console.log("Generando un NUEVO dilema...");
    setLoadingState(true);
    analysisSectionDiv.style.display = 'none';
    dilemmaSectionDiv.style.display = 'none';
    optionsContainerDiv.innerHTML = '';

    // *** NUEVO: Seleccionar un área ética aleatoria ***
    const randomIndex = Math.floor(Math.random() * ethicalAreas.length);
    const selectedArea = ethicalAreas[randomIndex];
    console.log("Área ética seleccionada:", selectedArea); // Útil para depuración

    // *** MODIFICACIÓN: Prompt enfocado en el área seleccionada ***
    const prompt = `
        Genera un dilema ético complejo y realista en el área de la medicina, específicamente enfocado en el siguiente tema: **${selectedArea}**.

        **Importante:** El dilema debe pertenecer claramente a la categoría mencionada (${selectedArea}). El caso debe ser distinto a otros que hayas generado recientemente.

        El resultado debe ser un objeto JSON válido con las siguientes claves:
        - "case": Una descripción concisa del caso (máximo 150 palabras) que ilustre un problema ético dentro del área "${selectedArea}".
        - "question": Una pregunta ética clara y directa sobre cómo proceder en el caso presentado.
        - "options": Un array de 3 o 4 strings, cada uno representando una opción de acción distinta y plausible frente al dilema. Las opciones deben reflejar diferentes enfoques o principios éticos relevantes para "${selectedArea}".

        Ejemplo de formato de salida esperado (SOLO formato, el contenido debe ser sobre ${selectedArea}):
        {
          "case": "Descripción del caso específico sobre ${selectedArea}...",
          "question": "¿Pregunta ética específica sobre este caso dentro de ${selectedArea}?",
          "options": [
            "Opción 1 relevante para el caso y el área",
            "Opción 2 relevante para el caso y el área",
            "Opción 3 relevante para el caso y el área"
          ]
        }

        Asegúrate de que el JSON sea válido y esté bien formado. No incluyas nada antes o después del objeto JSON.
    `;
    // *** FIN DE MODIFICACIÓN ***

    try {
        const responseText = await callBackendAPI(prompt);
        console.log("Respuesta recibida del backend (dilemma):", responseText);

        let dilemmaData;
        try {
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : responseText;
            dilemmaData = JSON.parse(jsonString.trim());
        } catch (parseError) {
             console.error("Error al parsear JSON del dilema:", parseError, "Respuesta recibida:", responseText);
             throw new Error(`La respuesta del backend no contenía un JSON válido para el dilema.`);
        }

        if (!dilemmaData || !dilemmaData.case || !dilemmaData.question || !dilemmaData.options || !Array.isArray(dilemmaData.options)) {
            console.error("JSON parseado incompleto:", dilemmaData);
            throw new Error("El JSON del dilema recibido no tiene la estructura esperada.");
        }

        currentDilemma = { ...dilemmaData, area: selectedArea }; // Guardamos también el área por si acaso
        displayDilemma(currentDilemma);

    } catch (error) {
        console.error("Error generando dilema:", error);
        caseTextP.textContent = `Error al generar el dilema (${selectedArea}): ${error.message}. Intenta de nuevo.`;
        questionTextP.textContent = '';
        optionsContainerDiv.innerHTML = '<button id="retry-dilemma-button">Reintentar Generar Dilema</button>';
        const retryButton = document.getElementById('retry-dilemma-button');
        if (retryButton) {
           retryButton.addEventListener('click', generateDilemma);
        }
    } finally {
        setLoadingState(false);
        dilemmaSectionDiv.style.display = 'block';
    }
}

// --- displayDilemma --- (Sin cambios significativos, muestra lo recibido)
function displayDilemma(dilemmaData) {
    // Podríamos opcionalmente mostrar el área:
    // const areaTitle = document.createElement('h3');
    // areaTitle.textContent = `Área: ${dilemmaData.area}`;
    // dilemmaSectionDiv.insertBefore(areaTitle, caseTextP.previousSibling); // O donde prefieras

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

// --- getAnalysis --- (El prompt ya incluye el contexto, no necesita grandes cambios)
async function getAnalysis(dilemma, chosenOption) {
    console.log("Obteniendo análisis...");
    setLoadingAnalysisState(true);
    analysisSectionDiv.style.display = 'block';
    analysisTextP.textContent = '';

    // El prompt de análisis ya recibe el caso, la pregunta y las opciones,
    // lo que implícitamente le da el contexto del área temática.
    // Podríamos añadir explícitamente el área si quisiéramos refinar más el análisis.
    const prompt = `
        Contexto: Se presentó el siguiente dilema ético médico (perteneciente al área de "${dilemma.area || 'Medicina General'}"):
        Caso: ${dilemma.case}
        Pregunta: ${dilemma.question}
        Opciones presentadas:
        ${dilemma.options.map((opt, i) => `- Opción ${i + 1}: ${opt}`).join('\n')}

        El usuario eligió la siguiente opción: "${chosenOption}"

        Tarea: Proporciona un análisis conciso (máximo 200 palabras) de la elección del usuario en el contexto de este caso.
        Enfócate en:
        1.  Posibles principios éticos (ej., autonomía, beneficencia, no maleficencia, justicia, etc.) que sustentan o entran en conflicto con esta elección.
        2.  Posibles consecuencias prácticas, tanto positivas como negativas, de esta decisión.
        3.  Evita juzgar la elección como 'correcta' o 'incorrecta'. Sé descriptivo y analítico.
        4.  Lenguaje claro y accesible.
        5.  Empieza directamente con el análisis sin repetir la opción elegida.
    `;

    try {
        const analysisResult = await callBackendAPI(prompt);
        console.log("Respuesta recibida del backend (análisis):", analysisResult);
        displayAnalysis(analysisResult);
    } catch (error) {
        console.error("Error obteniendo análisis:", error);
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
window.addEventListener('load', generateDilemma); // Carga el primer dilema al iniciar
