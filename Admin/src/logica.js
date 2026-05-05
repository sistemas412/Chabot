/**
 * CONFIGURACIÓN DE RUTAS Y ESTADOS
 */
const API_URL = 'http://localhost:4000/v1/bot'; 
const BOT_URL = 'http://localhost:3008/v1/messages';
let activePhone = '';
let chatInterval = null; // Control del refresco del historial
let usersInterval = null; // Control del refresco de la lista de usuarios

/**
 * Carga la lista de usuarios desde el backend (Puerto 4000)
 * Se ejecuta automáticamente cada 5 segundos para detectar nuevos chats
 */
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'x-api-key': 'EmcaSecret2026' }
        });
        
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        
        const users = await res.json();
        const container = document.getElementById('users-container');
        
        if (!container) return;

        const usersHTML = users.map(u => {
            const displayName = u.nombres || u.nombre || u.telefono;
            const isManual = u.bot_activo === 0;
            const isActive = u.telefono === activePhone ? 'active' : '';
            
            return `
                <div class="chat-item ${isActive}" onclick="loadChat('${u.telefono}')">
                    <div class="chat-info">
                        <b>${displayName}</b>
                        <small>${u.telefono}</small>
                    </div>
                    ${isManual ? '<span class="badge-humano">● Humano</span>' : ''}
                </div>
            `;
        }).join('');

        // Solo actualizar si hay cambios para evitar que se pierda el scroll en la lista
        if (container.innerHTML !== usersHTML) {
            container.innerHTML = usersHTML;
        }
    } catch (e) { 
        console.error("Error cargando usuarios:", e);
        const container = document.getElementById('users-container');
        if(container && !activePhone) {
            container.innerHTML = '<p style="color:red; padding:10px; font-size:12px;">Error de conexión con Backend</p>';
        }
    }
}

/**
 * Carga el historial de mensajes de un chat específico
 */
async function loadChat(phone) {
    // Si ya estamos en este chat, no reiniciamos todo, solo dejamos que el intervalo siga
    if (activePhone === phone && chatInterval) return;

    activePhone = phone;
    
    // 1. Limpiar intervalos previos para no duplicar peticiones
    if (chatInterval) clearInterval(chatInterval);
    
    // 2. Preparar Interfaz
    const input = document.getElementById('adminInput');
    const btnFinish = document.getElementById('btn-finish');
    const container = document.getElementById('messages');

    if(input) {
        input.disabled = false;
        input.focus(); 
    }
    if(btnFinish) btnFinish.style.display = 'block';
    
    // 3. Función de refresco de mensajes
    const fetchHistory = async () => {
        if (!activePhone) return;
        try {
            const res = await fetch(`${API_URL}/history/${activePhone}`, {
                headers: { 'x-api-key': 'EmcaSecret2026' }
            });
            const messages = await res.json();
            
            if (!container) return;

            const newHTML = messages.map(m => `
                <div class="msg ${m.emisor}">
                    <div class="bubble">
                        ${m.mensaje}
                        <small class="msg-time">
                            ${new Date(m.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </small>
                    </div>
                </div>
            `).join('');

            // Actualización inteligente: solo si hay mensajes nuevos
            if (container.innerHTML !== newHTML) {
                container.innerHTML = newHTML;
                container.scrollTop = container.scrollHeight; // Scroll al final
            }
        } catch (e) { 
            console.error("Error cargando historial:", e); 
        }
    };

    // 4. Carga inicial y repetición cada 3 segundos
    await fetchHistory();
    chatInterval = setInterval(fetchHistory, 3000);
    
    // Resaltar el usuario seleccionado en la lista inmediatamente
    fetchUsers(); 
}

/**
 * Envía un mensaje manual a través del bot (Puerto 3008)
 */
async function sendMessage() {
    const input = document.getElementById('adminInput');
    const text = input.value.trim();
    
    if(!text || !activePhone) return;

    // MEJORA: Limpiar input inmediatamente para dar fluidez
    input.value = '';
    input.focus();

    try {
        const res = await fetch(BOT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: activePhone, message: text })
        });

        if(!res.ok) throw new Error("No se pudo enviar el mensaje");
        
        // No llamamos a loadChat para no romper el intervalo, 
        // el setInterval traerá el mensaje en un par de segundos.
    } catch (e) {
        console.error("Error enviando mensaje:", e);
        alert("El mensaje no pudo enviarse. Revisa la conexión con el Bot.");
    }
}

/**
 * Manejador de teclado para enviar con Enter
 */
function handleKey(e) { 
    if(e.key === 'Enter') {
        sendMessage(); 
    }
}

/**
 * Finaliza la asesoría humana y reactiva el Bot
 */
async function reactivarBot() {
    if(!activePhone) return;

    const confirmar = confirm("¿Estás seguro de finalizar la asesoría y reactivar el Bot?");
    if(!confirmar) return;

    try {
        // 1. Cambiar estado en DB
        await fetch(`${API_URL}/reactivar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': 'EmcaSecret2026'
            },
            body: JSON.stringify({ telefono: activePhone })
        });

        // 2. Notificar al usuario por WhatsApp
        await fetch(BOT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                number: activePhone, 
                message: "✅ *Atención personalizada finalizada.* Nuestro asistente virtual EMCA vuelve a estar activo para ayudarte. ¡Gracias!" 
            })
        });

        // 3. Limpiar interfaz
        alert("Bot reactivado exitosamente");
        document.getElementById('messages').innerHTML = '';
        document.getElementById('adminInput').disabled = true;
        document.getElementById('btn-finish').style.display = 'none';
        activePhone = '';
        if (chatInterval) clearInterval(chatInterval);
        
        fetchUsers(); // Refrescar lista de usuarios
    } catch (e) {
        console.error("Error al reactivar:", e);
        alert("Hubo un error al intentar reactivar el bot.");
    }
}

/**
 * INICIALIZACIÓN
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
    usersInterval = setInterval(fetchUsers, 5000); // Actualiza la lista de chats cada 5 seg
});