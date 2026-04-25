const API_URL = 'http://localhost:4000/v1/bot'; // puerto del backend
const BOT_URL = 'http://localhost:3008/v1/messages'; //Puerto del Bot
let activePhone = '';

// Cargar lista de usuarios
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`); 
        const users = await res.json();
        const container = document.getElementById('users-container');
        
        container.innerHTML = users.map(u => `
            <div class="chat-item ${u.telefono === activePhone ? 'active' : ''}" onclick="loadChat('${u.telefono}')">
                <b>${u.nombre || u.telefono}</b><br>
                <small>${u.telefono}</small>
                ${u.bot_activo ? '' : ' <span style="color:red">● Humano</span>'}
            </div>
        `).join('');
    } catch (e) { console.error("Error cargando usuarios", e); }
}

// Cargar mensajes de un chat
async function loadChat(phone) {
    activePhone = phone;
    document.getElementById('adminInput').disabled = false;
    document.getElementById('btn-finish').style.display = 'block';
    
    try {
        const res = await fetch(`${API_URL}/history/${phone}`);
        const messages = await res.json();
        const container = document.getElementById('messages');
        
        container.innerHTML = messages.map(m => `
            <div class="msg ${m.emisor}">
                ${m.mensaje}
                <small style="display:block; font-size:10px; opacity:0.5; text-align:right">
                    ${new Date(m.fecha).toLocaleTimeString()}
                </small>
            </div>
        `).join('');
        container.scrollTop = container.scrollHeight;
    } catch (e) { console.error("Error historial", e); }
}

// Enviar mensaje a través del Bot
async function sendMessage() {
    const input = document.getElementById('adminInput');
    const text = input.value.trim();
    if(!text || !activePhone) return;

    await fetch(BOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: activePhone, message: text })
    });
    input.value = '';
    loadChat(activePhone); 
}

function handleKey(e) { if(e.key === 'Enter') sendMessage(); }

// Reactivar el Bot
async function reactivarBot() {
    await fetch(`${API_URL}/reactivar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: activePhone })
    });
    alert("Bot reactivado");
    fetchUsers();
}

// Intervalos de actualización
setInterval(fetchUsers, 10000);
setInterval(() => { if(activePhone) loadChat(activePhone); }, 4000);

fetchUsers(); // Carga inicial