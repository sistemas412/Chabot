import express from 'express';
import cors from 'cors';
import botRoutes from './routers/bot.routes';

const app = express();
app.use(cors());
app.use(express.json());

// Todas las rutas del bot tendrán el prefijo /v1/bot
app.use('/v1/bot', botRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Backend EMCA listo en puerto ${PORT}`));