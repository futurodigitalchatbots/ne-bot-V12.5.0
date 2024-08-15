document.addEventListener('DOMContentLoaded', () => {
    const timerElement = document.getElementById('timer');
    const messageElement = document.getElementById('message');
    const qrCodeDiv = document.getElementById('qr-code');
    const qrImage = document.getElementById('qr-image');

    if (!sessionStorage.getItem('timerShown')) {
        let timeLeft = 60; // Tiempo en segundos
        timerElement.textContent = `La página se recargará en ${timeLeft} segundos. Abre la aplicación de WhatsApp para vincular el QR.`;

        const interval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = `La página se recargará en ${timeLeft} segundos. Abre la aplicación de WhatsApp para vincular el QR.`;

            if (timeLeft <= 0) {
                clearInterval(interval);
                sessionStorage.setItem('timerShown', 'true');
                // Actualizar la página
                window.location.reload();
            }
        }, 1000);
    } else {
        // Mostrar el mensaje después de la recarga
        messageElement.classList.remove('hidden');
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 60000); // Mostrar el mensaje por 60 segundos

        // Ocultar el QR Code después de 120 segundos
        setTimeout(() => {
            qrCodeDiv.innerHTML = '';
            timerElement.classList.add('hidden');
        }, 120000); // Esperar 120 segundos para ocultar la imagen QR
    }

    // Cargar la imagen QR al inicio
    fetch('/qr')
        .then(response => response.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            qrCodeDiv.innerHTML = `<img id="qr-image" src="${url}" alt="QR Code">`;
        })
        .catch(error => console.error('Error fetching QR code:', error));
});

function addPatient() {
    const name = document.getElementById('patient-name').value;
    const number = document.getElementById('patient-number').value;

    if (name && number) {
        fetch('/add-patient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, number })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updatePatientList();
                document.getElementById('patient-name').value = '';
                document.getElementById('patient-number').value = '';
            }
        })
        .catch(error => console.error('Error adding patient:', error));
    } else {
        alert('Por favor, ingrese un nombre y un número.');
    }
}

function updatePatientList() {
    fetch('/patients')
        .then(response => response.json())
        .then(data => {
            const list = document.getElementById('patient-list');
            list.innerHTML = '';
            data.patients.forEach(patient => {
                const li = document.createElement('li');
                li.textContent = `${patient.name} - ${patient.number}`;
                list.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching patients:', error));
}

function sendSurvey() {
    fetch('/send-surveys', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Encuestas enviadas.');
            }
        })
        .catch(error => console.error('Error sending surveys:', error));
}

