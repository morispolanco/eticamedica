// En script.js

// ... (otras funciones y variables) ...

/**
 * Genera un nuevo dilema ético médico usando nuestra API backend.
 */
async function generateDilemma() {
    console.log("Generando un NUEVO dilema..."); // Log para confirmar llamada
    setLoadingState(true);
    analysisSectionDiv.style.display = 'none';
    dilemmaSectionDiv.style.display = 'none';
    optionsContainerDiv.innerHTML = '';

    // MODIFICACIÓN AQUÍ: Añadir instrucción para asegurar variedad
    const prompt = `
        Genera un dilema ético complejo y realista en el área de la medicina.
        **Importante: El dilema generado debe ser sustancialmente diferente a los que pudiste haber generado previamente en esta sesión.** Busca variedad en el tipo de problema ético (ej: consentimiento informado, asignación de recursos, confidencialidad, decisiones al final de la vida, investigación, etc.).

        El resultado debe ser un objeto JSON válido con las siguientes claves:
        - "case": Una descripción concisa del caso (máximo 150 palabras).
        - "question": Una pregunta ética clara y directa relacionada con el caso.
        - "options": Un array de 3 o 4 strings, cada uno representando una opción de acción distinta frente al dilema. Las opciones deben reflejar diferentes posturas éticas (ej: deontológica, utilitarista, ética del cuidado, etc.) sin etiquetarlas explícitamente.

        Ejemplo de formato de salida esperado (NO uses este ejemplo exacto):
        {
          "case": "Un paciente anciano con demencia avanzada necesita una cirugía mayor...",
          "question": "¿Qué curso de acción debería recomendar el equipo médico?",
          "options": [
            "Recomendar la cirugía...",
            "Priorizar la calidad de vida...",
            "Presentar objetivamente los riesgos...",
            "Consultar al comité de ética..."
          ]
        }

        Asegúrate de que el JSON sea válido y esté bien formado. No incluyas nada antes o después del objeto JSON.
    `;
    // FIN DE MODIFICACIÓN

    try {
        const responseText = await callBackendAPI(prompt); // Llama a /api/generate
        console.log("Respuesta recibida del backend (dilema):", responseText);

        // ... (resto del parseo y manejo de errores como estaba) ...

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

        currentDilemma = dilemmaData;
        displayDilemma(currentDilemma);

    } catch (error) {
        console.error("Error generando dilema:", error);
        caseTextP.textContent = `Error al generar el dilema: ${error.message}. Intenta de nuevo.`;
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

// ... (resto de script.js) ...
