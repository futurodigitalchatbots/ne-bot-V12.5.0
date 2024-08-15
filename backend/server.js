const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const port = 3000;
const dataFile = path.join(__dirname, 'data.json');
const responsesFile = path.join(__dirname, '../frontend/respuestas.json'); 

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuración de WhatsApp Web
const client = new Client();

client.on('qr', async (qr) => {
    try {
        const qrImage = await qrcode.toDataURL(qr);
        fs.writeFileSync(path.join(__dirname, 'qr.png'), qrImage.replace(/^data:image\/png;base64,/, ''), 'base64');
    } catch (error) {
        console.error('Error generating QR code:', error);
    }
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

// Rutas para obtener QR y gestionar pacientes
app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, 'qr.png'));
});

app.post('/add-patient', (req, res) => {
    const { name, number } = req.body;
    if (name && number) {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
        data.patients.push({ name, number });
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: 'Invalid input' });
    }
});

app.get('/patients', (req, res) => {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    res.json(data);
});

// Método para validar el número de teléfono
function validarNumeroTelefono(number) {
    // Validar número de 13 dígitos, incluyendo el código del país (+549) o sin él
    const regex = /^(?:\+549)?\d{10}$/; 
    return regex.test(number);
}

// Formatea el número en el formato requerido por WhatsApp
function formatNumber(number) {
    return number.replace(/^\+/, ''); // Eliminar el signo "+"
}

app.post('/send-surveys', async (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
        const initialMessageText = `Hola %nombre%. Me comunico de Sanatorio El Carmen. Nos gustaría conocer su experiencia durante su internación en nuestro Establecimiento.

Con el objetivo de seguir mejorando nuestros servicios, le invitamos a responder una breve encuesta de "Satisfacción de Internación".

Para continuar con la encuesta responda:
*Empezar encuesta*
de lo contrario responda:
*No*`;

        for (const patient of data.patients) {
            let number = patient.number.trim();
            if (!validarNumeroTelefono(number)) {
                console.log(`Número inválido: ${number}`);
                continue; // Si el número no es válido, pasar al siguiente paciente
            }

            number = formatNumber(number); // Formatear el número

            console.log(`Enviando mensaje al número: ${number}`);

            const message = initialMessageText.replace('%nombre%', patient.name);
            try {
                await client.sendMessage(number + '@c.us', message); // Agregar el dominio '@c.us' al número formateado
            } catch (error) {
                console.error(`Error sending message to ${number}:`, error);
            }

            // Pausa de 15 segundos antes de enviar el siguiente mensaje
            await new Promise(resolve => setTimeout(resolve, 15000));
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error sending surveys:', error);
        res.status(500).json({ success: false, message: 'Error sending surveys' });
    }
});

// Script de encuesta
const preguntas = [
    {
        texto: "1. En el momento de internarse, ¿recibió la suficiente información respecto a la cobertura de su obra social, honorarios, reglamento interno del sanatorio y trámites administrativos?\n✔️ Si  🚫 No",
        opciones: ["si", "no"]
    },
    {
        texto: "2. ¿En el momento del alta, recibió la información relacionada con su internación? (pautas de alarma, medicación, recomendaciones y controles)\n✔️ Si  🚫 No",
        opciones: ["si", "no"]
    },
    {
        texto: "3. ¿Cómo calificaría usted la atención médica que recibió?\n🚫 Mala\n❌ Podría ser mejor\n⚖️ Bueno\n✔️ Muy Bueno\n💯 Excelente",
        opciones: ["mala", "podría ser mejor", "bueno", "muy bueno", "excelente"]
    },
    {
        texto: "4. ¿Cómo calificaría usted la atención recibida por el servicio de enfermería?\n🚫 Mala\n❌ Podría ser mejor\n⚖️ Bueno\n✔️ Muy Bueno\n💯 Excelente",
        opciones: ["mala", "podría ser mejor", "bueno", "muy bueno", "excelente"]
    },
    {
        texto: "5. ¿Cómo considera en general la alimentación que recibió durante su internación?\n🚫 Mala\n❌ Podría ser mejor\n⚖️ Bueno\n✔️ Muy Bueno\n💯 Excelente",
        opciones: ["mala", "podría ser mejor", "bueno", "muy bueno", "excelente"]
    },
    {
        texto: "6. ¿Cómo calificaría la comodidad del sanatorio?\n🚫 Mala\n❌ Podría ser mejor\n⚖️ Bueno\n✔️ Muy Bueno\n💯 Excelente",
        opciones: ["mala", "podría ser mejor", "bueno", "muy bueno", "excelente"]
    },
    {
        texto: "7. ¿Cómo calificaría la limpieza del sanatorio?\n🚫 Mala\n❌ Podría ser mejor\n⚖️ Bueno\n✔️ Muy Bueno\n💯 Excelente",
        opciones: ["mala", "podría ser mejor", "bueno", "muy bueno", "excelente"]
    },
    {
        texto: "8. ¿Cómo calificaría su experiencia respecto del servicio que le brindó el sanatorio?\n🚫 Mala\n❌ Podría ser mejor\n⚖️ Bueno\n✔️ Muy Bueno\n💯 Excelente",
        opciones: ["mala", "podría ser mejor", "bueno", "muy bueno", "excelente"]
    },
    {
        texto: "9. ¿Recomendaría El Sanatorio El Carmen a familiares o amigos?\n✔️ Si  🚫 No",
        opciones: ["si", "no"]
    },
    {
        texto: "10. Desea realizar algún comentario o recomendación adicional? (Este paso es opcional)",
        opciones: [] // No hay opciones predefinidas para esta pregunta
    }
];

let preguntaActual = 0;
let encuestaIniciada = false;
let currentPatient = null; // Paciente actual

function enviarPregunta(message) {
    if (preguntaActual < preguntas.length) {
        client.sendMessage(message.from, preguntas[preguntaActual].texto);
    } else {
        client.sendMessage(message.from, "Gracias por completar la encuesta.");
        encuestaIniciada = false; // Resetea para futuras encuestas
        guardarRespuestas(currentPatient); // Guardar respuestas al completar la encuesta
    }
}

function guardarRespuestas(patient) {
    const respuestas = JSON.parse(fs.readFileSync(responsesFile, 'utf-8') || '[]');
    respuestas.push(patient);
    fs.writeFileSync(responsesFile, JSON.stringify(respuestas, null, 2));
}

client.on('message', async (message) => {
    if (message.body.toLowerCase().trim() === 'empezar encuesta' && !encuestaIniciada) {
        encuestaIniciada = true;
        preguntaActual = 0;
        currentPatient = { name: message._data.notifyName }; // Inicializa las respuestas del paciente
        enviarPregunta(message);
    } else if (encuestaIniciada) {
        const respuesta = message.body.toLowerCase().trim();
        const opciones = preguntas[preguntaActual].opciones;

        // Verificar si la respuesta es válida
        if (opciones.length === 0 || opciones.includes(respuesta)) {
            currentPatient[`pregunta ${preguntaActual + 1}`] = respuesta; // Almacena la respuesta del paciente
            preguntaActual++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Pausa de 15 segundos entre preguntas
            enviarPregunta(message);
        } else {
            client.sendMessage(message.from, "Por favor, responde con una opción válida.");
        }
    }
});

app.listen(port, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${port}`);
});

function guardarRespuestas(patient) {
    const respuestas = JSON.parse(fs.readFileSync(responsesFile, 'utf-8') || '{}');

    const now = new Date();
    const dailyData = { date: now, patient };
    const weeklyData = { date: now, patient };
    const monthlyData = { date: now, patient };

    // Guardar información en la sección diaria
    respuestas.diario.push(dailyData);

    // Guardar información en la sección semanal
    respuestas.semanal.push(weeklyData);

    // Guardar información en la sección mensual
    respuestas.mensual.push(monthlyData);

    fs.writeFileSync(responsesFile, JSON.stringify(respuestas, null, 2));
}

function limpiarDiario() {
    const respuestas = JSON.parse(fs.readFileSync(responsesFile, 'utf-8') || '{}');
    const now = new Date();

    // Filtrar respuestas que tienen menos de 24 horas
    respuestas.diario = respuestas.diario.filter(item => {
        return (now - new Date(item.date)) < 24 * 60 * 60 * 1000;
    });

    fs.writeFileSync(responsesFile, JSON.stringify(respuestas, null, 2));
}

function limpiarSemanal() {
    const respuestas = JSON.parse(fs.readFileSync(responsesFile, 'utf-8') || '{}');
    const now = new Date();

    // Filtrar respuestas que tienen menos de 7 días
    respuestas.semanal = respuestas.semanal.filter(item => {
        return (now - new Date(item.date)) < 7 * 24 * 60 * 60 * 1000;
    });

    fs.writeFileSync(responsesFile, JSON.stringify(respuestas, null, 2));
}

function limpiarMensual() {
    const respuestas = JSON.parse(fs.readFileSync(responsesFile, 'utf-8') || '{}');
    const now = new Date();

    // Filtrar respuestas que tienen menos de 30 días
    respuestas.mensual = respuestas.mensual.filter(item => {
        return (now - new Date(item.date)) < 30 * 24 * 60 * 60 * 1000;
    });

    fs.writeFileSync(responsesFile, JSON.stringify(respuestas, null, 2));
}

function generarResultadosYDescargar() {
    const respuestas = JSON.parse(fs.readFileSync(responsesFile, 'utf-8') || '{}');

    // Aquí puedes personalizar el formato y contenido de resultados.html
    const resultadosHTML = `<html><body><h1>Resultados del último mes</h1>...</body></html>`;
    fs.writeFileSync(path.join(__dirname, '../frontend/resultados.html'), resultadosHTML);

    // Copiar respuestas.json para su descarga
    fs.copyFileSync(responsesFile, path.join(__dirname, '../frontend/respuestas.json'));
    fs.copyFileSync(responsesFile, path.join(__dirname, '../frontend/results.css'));
}

// Llamar la función el primer día de cada mes
setInterval(() => {
    const now = new Date();
    if (now.getDate() === 1) {
        generarResultadosYDescargar();
        fs.writeFileSync(responsesFile, JSON.stringify({ diario: [], semanal: [], mensual: [] }, null, 2));
    }
}, 24 * 60 * 60 * 1000);  // Verifica cada 24 horas



