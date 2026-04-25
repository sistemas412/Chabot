import { Router } from 'express';
import { BotController } from '../controllers/bot.controller';

const router = Router();

// Verificar usuario y estado del bot (Híbrido)
router.get('/user/:telefono', BotController.checkUser);

// Registro y Trámites
router.post('/save', BotController.handleBotAction);

// Historial de chat (para mostrar en el frontend)
router.get('/history/:telefono', BotController.getChatHistory);

// Control del Asesor Humano
router.post('/asesor', BotController.solicitarAsesor);
router.post('/reactivar', BotController.reactivarBot);

export default router;