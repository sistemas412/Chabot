import * as dotenv from 'dotenv';
import { join } from 'path';
import { createBot, createProvider, createFlow, addKeyword, utils, addAnswer } from '@builderbot/bot';
import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';

dotenv.config()

const PORT = process.env.PORT ?? 3008

// --- FUNCIÓN BACKEND ---
const saveToBackend = async (data: any) => {
    try {

        const response = await fetch('http://localhost:4000/v1/bot/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'EmcaSecret2026'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();

    } catch (e) {
        console.error('Error conectando con el backend:', e);
        return null;
    }
}

const guardarMensaje = async (
    telefono: string,
    mensaje: string,
    emisor: string
) => {

    await saveToBackend({
        tipo: 'GUARDAR_MENSAJE',
        telefono,
        mensaje,
        emisor
    });
}



// --- 1. FLUJO HIJO: POSTE (Caso 10) ---
// Se define primero para que menuFlow lo reconozca
// Se define primero para que menuFlow lo reconozca
const posteFlow = addKeyword<Provider, Database>(utils.setEvent('POSTE_FLOW'))
    .addAnswer('Por favor, escribe el *Número del Poste* (Ej: ABC-123) para generar el reporte técnico:', 
        { capture: true }, 
        async (ctx: any, { state, flowDynamic, endFlow }: any) => {
            const numPoste = ctx.body;

            // 1. VERIFICACIÓN DE MODO MANUAL: 
            // Si el admin activó el modo humano mientras el usuario escribía el poste, el bot debe detenerse.
            const response = await fetch(`http://localhost:4000/v1/bot/user/${ctx.from}`, {
                headers: { 'x-api-key': 'EmcaSecret2026' }
            });
            const user = await response.json();
            
            if (user && user.bot_activo === 0) {
                console.log(`[POSTE_FLOW] Abortado: Modo manual activo para ${ctx.from}`);
                return endFlow(); // Detiene el bot inmediatamente
            }

            // 2. OBTENCIÓN DE DATOS Y ENVÍO:
            const userData = state.getMyState();
            
            await saveToBackend({
                tipo: 'REPORTE_POSTE',
                cedula: userData.cedula,
                detalle: numPoste,
                telefono: ctx.from
            });

            await flowDynamic(`✅ Reporte del poste *${numPoste}* enviado exitosamente.`);
            
            // Sugerencia: Enviar al usuario de vuelta al menú o preguntar si necesita algo más
            return await flowDynamic('¿Deseas realizar otra consulta? Escribe *MENÚ* o *GRACIAS*.');
        }
    );
// --- 2. FLUJO INTERMEDIO: MENÚ PRINCIPAL ---
// Se define segundo para que welcomeFlow pueda saltar aquí
const menuFlow = addKeyword<Provider, Database>(utils.setEvent('MENU_PRINCIPAL'))
    .addAnswer(
        [
            'Por favor, elige una opción escribiendo el número:',
            '*1.* Horarios y Ubicación 📍',
            '*2.* Reporte de daños 🚨',
            '*3.* Líneas de atención 📞',
            '*5.* PQRS 🗣️',
            '*6.* Recolección 🚛',
            '*7.* Medidores',
            '*8.* Predio desocupado',
            '*9.* Alumbrado',
            '*10.* Número de poste',
            '*11.* Doble factura',
            '*12.* Solicitar un asesor 👨‍💼',
            '',
            '-- Escribe el número de tu consulta --'
        ],
       { capture: true },
        async (ctx: any, { flowDynamic, gotoFlow, fallBack }: any) => {

          const opcion = ctx.body;

         // GUARDAR MENSAJE DEL USUARIO
           await guardarMensaje(
             ctx.from,
             opcion,
             'USUARIO'
             );
            // Lista de opciones permitidas
            const opcionesValidas = ['1','2','3','5','6','7','8','9','10','11', '12'];

            if (!opcionesValidas.includes(opcion)) {
                // Aquí personalizamos el mensaje de error "Anti-Hola"
                return fallBack(
                    '❌ *Perdón, no entendí tu respuesta.*\n\n' +
                    'Para poder colaborarte, por favor indica el *número* de la opción que necesitas del menú anterior.'
                );
            }
                  switch (opcion) {

    case '1': {

        const respuesta =
        '🕒 *Horarios:* Lun-Vie (7:30am-5:30pm)\n📍 *Dirección:* Carrera 24 No. 39-54';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '2': {

        const respuesta =
        '🚨 *REPORTE DE DAÑOS*\nLínea 24h: +57 302 4091910\nFavor indicar dirección y barrio.';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '3': {

        const respuesta =
        '📞 *Líneas de atención:*\nBarcelona: +57 302 409 19 06\nAnticorrupción: 157';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '5': {

        const respuesta =
        '📩 *Radicación de PQR*\nOficial en: https://www.calarca-quindio.gov.co/peticiones-quejas-reclamos/enviar/3';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '6': {

        const respuesta =
        '🚛 *RECOLECCIÓN*\nEspecies: +57 302 409 19 12';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '7': {

        const respuesta =
        '📟 *Medidores*\n📍 Trámite presencial\n⏳ Respuesta: 15 días hábiles.';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '8': {

        const respuesta =
        '🏠 *Predio desocupado*\nRequiere documentos radicados en ventanilla única.';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );

        break;
    }

    case '9': {

        const respuesta =
        '💡 *ALUMBRADO*\nReportes: +57 302 409 19 13';

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );
        break;
      }
      case '10':
           return gotoFlow(posteFlow);
       case '11': {

          const respuesta =
          '💰 *DOBLE FACTURACIÓN*\nTrámite PRESENCIAL con los dos recibos físicos.';

          await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
         );
         break;
               }
              case '12': {

                     const respuesta =
                     'Conectando con un asesor... Por favor espera un momento.';
                     await flowDynamic(respuesta);

                 await guardarMensaje(
                   ctx.from,
                   respuesta,
                   'BOT'
              );

    await gotoFlow(asesorFlow);
    return;
  }
}
            return await flowDynamic('¿Deseas consultar algo más? Escribe *MENÚ* para volver o *GRACIAS* para terminar.');
        }
    )
    .addAnswer('¿Deseas consultar algo más? Escribe tu mensaje o marca otra opción.');

    const flowGracias = addKeyword<Provider, Database>(['gracias', 'finalizar', 'terminar'])
    .addAnswer([
        '¡Fue un placer ayudarte! 😊',
        'Recuerda que en *EMCA* trabajamos para ti.',
        'Si necesitas algo más, solo escribe *HOLA*.'
    ]);

    const flowMenuPrincipal = addKeyword<Provider, Database>(['menu', 'menú', 'volver'])
    .addAnswer('Regresando al menú principal...', null, async (_: any, { gotoFlow }:{gotoFlow: any}) => {
        return gotoFlow(menuFlow);
    });

    const asesorFlow = addKeyword<Provider, Database>(utils.setEvent('ASESOR_FLOW'))
    .addAnswer('Has solicitado un asesor. El administrador se pondrá en contacto contigo pronto.', 
    null, 
    async (ctx: any, { provider }:{provider: any}) => {
        // Esto le avisa al administrador por consola o puedes enviar un mensaje a su número
        console.log(`⚠️ ATENCIÓN: El usuario ${ctx.from} solicita asesoría humana.`);
        
        // OPCIONAL: Algunos proveedores permiten "pausar" el bot para este número específico
        // Si usas Meta, el administrador simplemente escribe desde el Panel de Meta o el celular vinculado.
    });

// --- 3. FLUJO DE ENTRADA: BIENVENIDA Y REGISTRO ---
const welcomeFlow = addKeyword<Provider, Database>(['hi', 'hello', 'hola'])
    .addAction(async (ctx: any, { state, gotoFlow, flowDynamic }: any) => {
        try {
            // VALIDAR SI EL BOT ESTÁ PAUSADO
const response = await fetch(`http://localhost:4000/v1/bot/user/${ctx.from}`, {
    headers: {
        'x-api-key': 'EmcaSecret2026'
    }
});

    if (!response.ok) return;

     const user = await response.json();

     // SI EL BOT ESTÁ DESACTIVADO => NO RESPONDER
      if (user.bot_activo === 0) {

      // GUARDAR MENSAJE DEL USUARIO
        await guardarMensaje(
           ctx.from,
           ctx.body,
           'USUARIO'
        );
         console.log(`⛔ BOT PAUSADO PARA ${ctx.from}`);
          return;
        }

        } catch (error) {
            console.error("Error en validación de tiempo:", error);
        }
    })
    .addAnswer('Para brindarte una mejor atención, por favor ingresa tu *Nombre Completo*:', 
        { capture: true }, 
        async (ctx: any, { state }:{state: any}) => {
            await state.update({ nombre: ctx.body })
        }
    )
    .addAnswer('Gracias. Ahora ingresa tu número de *Cédula*:', 
        { capture: true }, 
        async (ctx: any, { state, fallBack }:{state: any , fallBack: any}) => {
            if (!/^\d+$/.test(ctx.body)) {
                return fallBack('Por favor, ingresa solo números para la cédula.')
            }
            await state.update({ cedula: ctx.body })
        }
    )
    .addAnswer('Por último, ingresa tu *Correo Electrónico*:', 
        { capture: true }, 
        async (ctx: any, { state, fallBack, flowDynamic, gotoFlow }:{state: any, fallBack: any, flowDynamic: any, gotoFlow: any}) => { 
            if (!ctx.body.includes('@')) {
                return fallBack('Por favor, ingresa un correo electrónico válido.')
            }
            await state.update({ email: ctx.body })
            const userData = state.getMyState();
            
            await saveToBackend({
                tipo: 'REGISTRO_USUARIO',
                nombre: userData.nombre,
                cedula: userData.cedula,
                email: userData.email,
                telefono: ctx.from
            });

            

            await flowDynamic('✅ ¡Datos registrados exitosamente!');
            return gotoFlow(menuFlow); // Registro terminado, va al menú
        }
    );

// --- FLUJOS EXTRAS ---
const fullSamplesFlow = addKeyword<Provider, Database>(['samples', utils.setEvent('SAMPLES')])
    .addAnswer(`💪 I'll send you a lot files...`)
    .addAnswer(`Imagen Local`, { media: join(process.cwd(), 'assets', 'sample.png') });

// --- CONFIGURACIÓN PRINCIPAL ---
const main = async () => {
    // El orden de los flujos es importante para la prioridad de respuesta
    const adapterFlow = createFlow([
        posteFlow, 
        menuFlow, 
        welcomeFlow, 
        fullSamplesFlow, 
        asesorFlow, 
        flowGracias, 
        flowMenuPrincipal,
    ])
    
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.jwtToken,
        numberId: process.env.numberId,
        verifyToken: process.env.verifyToken,
        version: 'v25.0',
        port: +PORT
    })
    
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    // --- ENDPOINT HTTP PARA RESPUESTAS DEL ASESOR ---
   adapterProvider.server.post(
'/v1/messages',
handleCtx(async (bot: any, req: any) => {

    // Verificar que el bot exista
    if (!bot) {
        return {
            error: 'Bot no inicializado'
        };
    }

    try {

        const { number, message, urlMedia } = req.body;

        // Validar datos requeridos
        if (!number || !message) {
            return {
                error: 'Faltan campos requeridos (number, message)'
            };
        }

        // Enviar mensaje a WhatsApp
        await bot.sendMessage(number, message, {
            media: urlMedia ?? null
        });

        // Guardar mensaje del ADMIN en MySQL
        await fetch('http://localhost:4000/v1/bot/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'EmcaSecret2026'
            },
            body: JSON.stringify({
                tipo: 'GUARDAR_MENSAJE',
                telefono: number,
                mensaje: message,
                emisor: 'ADMIN'
            })
        });

        // Respuesta correcta
        return {
            status: 'sended',
            to: number
        };

    } catch (error) {

        console.error('Error al enviar mensaje vía API:', error);

        return {
            error: 'Error al procesar el mensaje'
        };
    }
}));

    // Iniciar el servidor
    httpServer(+PORT)
    console.log(`✅ BOT EMCA ACTIVADO EN PUERTO ${PORT}`)
}

main().catch(err => {
    console.error("🔴 Error al arrancar el bot:", err);
    process.exit(1);
});

