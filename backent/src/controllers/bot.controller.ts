import { Request, Response } from 'express';
import { pool } from '../config/db';

export class BotController {
    
    static async handleBotAction(req: Request, res: Response) {
        try {
            const apiKey = req.headers['x-api-key'];
            if (apiKey !== process.env.BOT_API_KEY) {
                return res.status(401).json({ error: 'No autorizado' });
            }

            // Forzamos valores por defecto para evitar el error de 'undefined'
            const tipo = req.body.tipo || '';
            const telefono = req.body.telefono || '';
            const cedula = req.body.cedula || null;
            const detalle = req.body.detalle || '';
            const nombre = req.body.nombre || '';
            const email = req.body.email || null;
            const mensaje = req.body.mensaje || '';
            const emisor = req.body.emisor || 'BOT';

            if (!tipo || !telefono) {
                return res.status(400).json({ error: 'Faltan campos obligatorios' });
            }

            if (tipo === 'GUARDAR_MENSAJE') {
                await pool.execute(
                    'INSERT INTO mensajes (telefono_usuario, mensaje, emisor) VALUES (?, ?, ?)',
                    [telefono, mensaje, emisor]
                );
                return res.status(201).json({ success: true });
            }

            if (tipo === 'SOLICITUD_ASESOR') {
                await pool.execute('UPDATE usuarios SET bot_activo = FALSE WHERE telefono = ?', [telefono]);
                await pool.execute('INSERT INTO solicitudes_asesor (telefono_usuario) VALUES (?)', [telefono]);
                return res.status(200).json({ success: true });
            }

            if (tipo === 'REGISTRO_USUARIO') {
                await pool.execute(
                    'INSERT INTO usuarios (nombre, cedula, email, telefono, bot_activo) VALUES (?, ?, ?, ?, TRUE) ON DUPLICATE KEY UPDATE nombre=?',
                    [nombre, cedula, email, telefono, nombre]
                );
                return res.status(201).json({ success: true });
            }

            if (tipo === 'REPORTE_POSTE') {
                await pool.execute(
                    'INSERT INTO reportes_postes (cedula_usuario, numero_poste, telefono_reporte) VALUES (?, ?, ?)',
                    [cedula, detalle, telefono]
                );
                return res.status(201).json({ success: true });
            }

            const menuMapping: Record<string, string> = {
                '2': 'DAÑO_EMERGENCIA',
                '5': 'PQRS',
                '6': 'RECOLECCION',
                '11': 'DOBLE_FACTURACION'
            };

            const categoria = menuMapping[tipo] || tipo || 'CONSULTA_GENERAL';

            await pool.execute(
                'INSERT INTO tramites (cedula_usuario, tipo_tramite, detalle, telefono_contacto) VALUES (?, ?, ?, ?)',
                [cedula, categoria, detalle || 'Sin detalle', telefono]
            );

            return res.status(201).json({ success: true });

        } catch (error) {
            console.error('Error:', error); 
            return res.status(500).json({ error: 'Error interno' });
        }
    }

    static async checkUser(req: Request, res: Response) {
    try {
        const { telefono } = req.params;

        // Forzamos a que 'tel' sea un string sí o sí.
        // Si 'telefono' es undefined, se convertirá en una cadena vacía ''.
        const tel: string = String(telefono ?? '');

        // Al usar [tel], TypeScript ya no ve un posible 'undefined' dentro del array
        const [rows]: any = await pool.execute(
            'SELECT nombre AS nombres, cedula, email, bot_activo FROM usuarios WHERE telefono = ?', 
            [tel]
        );
        
        if (rows.length > 0) {
            return res.json(rows[0]);
        }

        return res.status(404).json({ message: 'Usuario no registrado' });

    } catch (error) {
        console.error('Error DB:', error);
        return res.status(500).json({ error: 'Error de consulta' });
    }
}

    static async reactivarBot(req: Request, res: Response) {
        try {
            const telefono = req.body.telefono || '';
            await pool.execute('UPDATE usuarios SET bot_activo = TRUE WHERE telefono = ?', [telefono]);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: 'Error' });
        }
    }

    static async getChatHistory(req: Request, res: Response) {
        try {
            const { telefono } = req.params;
            const [rows]: any = await pool.execute(
                'SELECT * FROM mensajes WHERE telefono_usuario = ? ORDER BY fecha ASC',
                [telefono || '']
            );
            return res.json(rows);
        } catch (error) {
            return res.status(500).json({ error: 'Error' });
        }
    }

    static async solicitarAsesor(req: Request, res: Response) {
        try {
            const telefono = req.body.telefono || '';
            
            // 1. Pausamos el bot para este usuario
            await pool.execute('UPDATE usuarios SET bot_activo = FALSE WHERE telefono = ?', [telefono]);
            
            // 2. Creamos la entrada en la tabla de solicitudes para la jefa
            await pool.execute('INSERT INTO solicitudes_asesor (telefono_usuario) VALUES (?)', [telefono]);
            
            return res.status(200).json({ 
                success: true, 
                message: 'Modo humano activado. El bot se ha pausado.' 
            });
        } catch (error) {
            console.error('Error al pausar el bot:', error);
            return res.status(500).json({ error: 'Error interno al solicitar asesor' });
        }
    }
}