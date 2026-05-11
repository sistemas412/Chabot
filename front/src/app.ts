import * as dotenv from 'dotenv';
import { join } from 'path';
import {
    createBot,
    createProvider,
    createFlow,
    addKeyword,
    utils
} from '@builderbot/bot';

import { MemoryDB as Database } from '@builderbot/bot';
import { MetaProvider as Provider } from '@builderbot/provider-meta';
import { userInfo } from 'os';

dotenv.config();

const PORT = process.env.PORT ?? 3008;

/* =========================================================
   BACKEND
========================================================= */

const saveToBackend = async (data: any) => {

    try {

        const response = await fetch(
            'http://localhost:4000/v1/bot/save',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'EmcaSecret2026'
                },
                body: JSON.stringify(data)
            }
        );

        return await response.json();

    } catch (e) {

        console.error('Error backend:', e);

        return null;
    }
};

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
};

/* =========================================================
   FLOW FINALIZAR
========================================================= */

const flowGracias = addKeyword<Provider, Database>([
    'gracias',
    'finalizar',
    'terminar'
])
.addAnswer([
    '✅ Fue un gusto atenderte.',
    'EMCA agradece tu contacto.',
    'Escribe *HOLA* cuando necesites ayuda nuevamente.'
], 

null,
async (ctx: any) => {

    await guardarMensaje(
        ctx.from,
     `✅ Fue un gusto atenderte.
      EMCA agradece tu contacto.
      Escribe *HOLA* cuando necesites ayuda nuevamente.`,
        'BOT'
    );
});

/* =========================================================
   FLOW MENU
========================================================= */

const flowMenuPrincipal = addKeyword<Provider, Database>([
    'menu',
    'menú',
    'volver'
])
.addAnswer(
    '🔄 Regresando al menú principal...',
    null,
    async (_: any, { gotoFlow }: any) => {
        return gotoFlow(menuFlow);
    }
);

/* =========================================================
   FLOW POSTE
========================================================= */

const posteFlow = addKeyword(utils.setEvent('POSTE_FLOW'))

.addAnswer(
    'Por favor escribe el número del poste:',
    { capture: true },

    async (ctx: any, { state, flowDynamic }: any) => {

        const numPoste = ctx.body;

        await guardarMensaje(
            ctx.from,
            numPoste,
            'USUARIO'
        );

        const userData = state.getMyState();

        await saveToBackend({
            tipo: 'REPORTE_POSTE',
            cedula: userData.cedula,
            detalle: numPoste,
            telefono: ctx.from
        });

        const respuesta =
            `✅ Reporte del poste ${numPoste} enviado correctamente`;

        await flowDynamic(respuesta);

        await guardarMensaje(
            ctx.from,
            respuesta,
            'BOT'
        );
    }
);

/* =========================================================
   FLOW ASESOR
========================================================= */

const asesorFlow = addKeyword(utils.setEvent('ASESOR_FLOW'))

.addAnswer(
    'Has solicitado un asesor. El administrador se pondrá en contacto contigo pronto.',

    null,

    async (ctx: any) => {

        console.log(
            `⚠️ Usuario ${ctx.from} solicita asesor`
        );

        await saveToBackend({
            tipo: 'DESACTIVAR_BOT',
            telefono: ctx.from
        });

        await guardarMensaje(
            ctx.from,
            'Has solicitado un asesor. El administrador se pondrá en contacto contigo pronto.',
            'BOT'
        );
    }
);

/* =========================================================
   MENU PRINCIPAL
========================================================= */

const menuFlow = addKeyword(['menu', 'menú'])

.addAnswer(
[
'📋 *MENÚ PRINCIPAL*',
'',
'1️⃣ Horarios y ubicación',
'2️⃣ Reporte de daños',
'3️⃣ Líneas de atención',
'5️⃣ PQRS',
'6️⃣ Recolección',
'7️⃣ Medidores',
'8️⃣ Predio desocupado',
'9️⃣ Alumbrado',
'🔟 Número de poste',
'1️⃣1️⃣ Doble factura',
'1️⃣2️⃣ Solicitar asesor',
'',
'Escribe el número de tu consulta'
],

{ capture: true },

async (ctx: any, { flowDynamic, gotoFlow, fallBack }: any) => {

    const opcion = ctx.body;

    await guardarMensaje(
        ctx.from,
        opcion,
        'USUARIO'
    );

    const opcionesValidas = [
        '1',
        '2',
        '3',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12'
    ];

    if (!opcionesValidas.includes(opcion)) {

        const error =
            '❌ Opción inválida. Escribe un número válido del menú.';

        await guardarMensaje(
            ctx.from,
            error,
            'BOT'
        );

        return fallBack(error);
    }

    switch (opcion) {

        case '1': {

            const respuesta =
                '🕒 Horarios: Lun-Vie 7:30am - 5:30pm\n📍 Dirección: Carrera 24 #39-54';

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
                '🚨 Reporte de daños\nLínea: +57 3024091910';

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
                '📞 Líneas de atención\n+57 3024091906';

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
                '📩 PQRS:\nhttps://www.calarca-quindio.gov.co';

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
                '🚛 Recolección:\n+57 3024091912';

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
                '📟 Medidores\nTrámite presencial';

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
                '🏠 Predio desocupado\nDebes presentar documentos físicos';

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
                '💡 Alumbrado\n+57 3024091913';

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
                '💰 Doble facturación\nTrámite presencial';

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

            return gotoFlow(asesorFlow);
        }
    }

    return await flowDynamic(
        '¿Deseas algo más? Escribe MENÚ o GRACIAS'
    );
}
);

/* =========================================================
   FLOW BIENVENIDA
========================================================= */
const welcomeFlow = addKeyword<Provider, Database>(['hola', 'hi', 'hello'])

.addAction(async (ctx: any) => {

    // GUARDAR SIEMPRE EL MENSAJE DEL USUARIO
    await guardarMensaje(
        ctx.from,
        ctx.body,
        'USUARIO'
    );

    try {

        const response = await fetch(
            `http://localhost:4000/v1/bot/user/${ctx.from}`,
            {
                headers: {
                    'x-api-key': 'EmcaSecret2026'
                }
            }
        );

        if (!response.ok){
            console.log("Backent no responde");
            return;
        }

        const user = await response.json();

        // SI EL BOT ESTÁ EN MODO ASESOR
         if (
            Number(user?.bot_activo) === 0 &&
            !['hola', 'hi', 'hello']
                .includes(ctx.body.toLowerCase())
        ) {

            console.log(
                `⛔ BOT PAUSADO PARA ${ctx.from}`
            );

        }
    } catch (error) {

        console.error(
            'Error validando usuario:',
            error
        );

    }
})

.addAnswer(
    'Para brindarte una mejor atención, por favor ingresa tu *Nombre Completo*:',
    { capture: true },
    async (ctx: any, { state }: any) => {

        await guardarMensaje(
            ctx.from,
            ctx.body,
            'USUARIO'
        );

        await guardarMensaje(
            ctx.from,
            'Para brindarte una mejor atención, por favor ingresa tu *Nombre Completo*:',
            'BOT'
        )

        await state.update({
            nombre: ctx.body
        });
    }
)

.addAnswer(
    'Ahora ingresa tu número de *Cédula*:',
    { capture: true },
    async (ctx: any, { state, fallBack }: any) => {

        await guardarMensaje(
            ctx.from,
            ctx.body,
            'USUARIO'
        );

        await guardarMensaje(
            ctx.from,
            'Ahora ingresa tu número de *Cédula*:',
            'BOT'
        );

        if (!/^\d+$/.test(ctx.body)) {

            return fallBack(
                'Por favor ingresa solo números.'
            );
        }

        await state.update({
            cedula: ctx.body
        });
    }
)

.addAnswer(
    'Por último, ingresa tu *Correo Electrónico*:',
    { capture: true },
    async (
        ctx: any,
        {
            state,
            fallBack,
            flowDynamic,
            gotoFlow
        }: any
    ) => {

        await guardarMensaje(
            ctx.from,
            ctx.body,
            'USUARIO'
        );

        await guardarMensaje(
            ctx.from,
            'Por último, ingresa tu *Correo Electrónico*:',
            'BOT'
        );

        if (!ctx.body.includes('@')) {

            return fallBack(
                'Por favor ingresa un correo válido.'
            );
        }

        await state.update({
            email: ctx.body
        });

        const userData = state.getMyState();

        await saveToBackend({
            tipo: 'REGISTRO_USUARIO',
            nombre: userData.nombre,
            cedula: userData.cedula,
            email: userData.email,
            telefono: ctx.from
        });

        const menuTexto = `
📋 *MENÚ PRINCIPAL*

1️⃣ Horarios y ubicación
2️⃣ Reporte de daños
3️⃣ Líneas de atención
5️⃣ PQRS
6️⃣ Recolección
7️⃣ Medidores
8️⃣ Predio desocupado
9️⃣ Alumbrado
🔟 Número de poste
1️⃣1️⃣ Doble factura
1️⃣2️⃣ Solicitar asesor

Escribe el número de tu consulta
        `;

        await flowDynamic(
            '✅ ¡Datos registrados exitosamente!'
        );

        await guardarMensaje(
            ctx.from,
            menuTexto,
            'BOT'
        );

        return gotoFlow(menuFlow);
    }
);

/* =========================================================
   FLOW EXTRA
========================================================= */

const fullSamplesFlow = addKeyword<Provider, Database>([
    'samples',
    utils.setEvent('SAMPLES')
])

.addAnswer(
    'Imagen local',
    {
        media: join(
            process.cwd(),
            'assets/sample.png'
        )
    }
);
 /**Captura de mensajes del usuario con el administrador */

const capturaMensajesFlow = addKeyword<Provider, Database>(
    utils.setEvent('MESSAGE')
)

.addAction(async (ctx: any, { endFlow }: any) => {

    await guardarMensaje(
        ctx.from,
        ctx.body,
        'USUARIO'
    );

    try {

        const response = await fetch(
            `http://localhost:4000/v1/bot/user/${ctx.from}`,
            {
                headers: {
                    'x-api-key': 'EmcaSecret2026'
                }
            }
        );

        if (!response.ok) return;

        const user = await response.json();

        // 👨‍💼 MODO HUMANO
        if (Number(user?.bot_activo) === 0) {

            console.log(
                `💬 HUMANO ${ctx.from}: ${ctx.body}`
            );

            return endFlow();
        }

    } catch (e) {

        console.error(e);
    }
});

const validarModoHumano = async (ctx: any) => {

    await guardarMensaje(
        ctx.from,
        ctx.body,
        'USUARIO'
    );

    try {

        const response = await fetch(
            `http://localhost:4000/v1/bot/user/${ctx.from}`,
            {
                headers: {
                    'x-api-key': 'EmcaSecret2026'
                }
            }
        );

        if (!response.ok) return false;

        const user = await response.json();

        return Number(user?.bot_activo) === 0;

    } catch (error) {

        console.error(error);

        return false;
    }
};

/* =========================================================
   MAIN
========================================================= */

const main = async () => {

   const adapterFlow = createFlow([

    posteFlow,
    menuFlow,
    welcomeFlow,
    fullSamplesFlow,
    asesorFlow,
    flowGracias,
    flowMenuPrincipal,
    capturaMensajesFlow
]);

    const adapterProvider = createProvider(
        Provider,
        {
            jwtToken: process.env.jwtToken,
            numberId: process.env.numberId,
            verifyToken: process.env.verifyToken,
            version: 'v25.0',
            port: +PORT
        }
    );

    const adapterDB = new Database();

    const { handleCtx, httpServer } =
        await createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB
        });

    /* =========================================================
       API ADMIN
    ========================================================= */

    adapterProvider.server.post(

        '/v1/messages',

        handleCtx(async (bot: any, req: any) => {

            try {

                const {
                    number,
                    message,
                    urlMedia
                } = req.body;

                await bot.sendMessage(
                    number,
                    message,
                    {
                        media: urlMedia ?? null
                    }
                );

                const botEstaPausado = (user: any) => {
                 return user?.bot_activo === 0;
                };

                await guardarMensaje(
                    number,
                    message,
                    'ADMIN'
                );

                return {
                    status: 'sended',
                    to: number
                };

             
            } catch (e) {

                console.error(e);

                return {
                    error: true
                };
            }
        })
    );

    httpServer(+PORT);

    console.log(
        `✅ BOT EMCA ACTIVO EN PUERTO ${PORT}`
    );
};

main().catch(console.error);