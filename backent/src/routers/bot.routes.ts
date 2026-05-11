// En tu archivo bot.routes.ts
import { Router } from 'express';
import { BotController } from '../controllers/bot.controller';

const router = Router();

// Esta es la ruta que llama tu logica.js: fetch(`${API_URL}/users`)
router.get('/users', BotController.getAllUsers); 

// Otras rutas necesarias
router.get('/user/:telefono', BotController.checkUser);
router.get('/history/:telefono', BotController.getChatHistory);
router.post('/reactivar', BotController.reactivarBot);
router.post('/action', BotController.handleBotAction);
router.post('/send-message', BotController.sendMessage);
router.post('/save', BotController.saveData);
router.post('/reactivar', BotController.reactivarBot);
    
export default router;