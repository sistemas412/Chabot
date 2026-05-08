import { pool } from '../config/db'; 

export const checkUserInDB = async (telefono: string) => {
    try {
        
        const [rows]: any = await pool.query(
            'SELECT nombre AS nombres, cedula, email FROM usuarios WHERE telefono = ? LIMIT 1', 
            [telefono]
        );

        if (rows.length > 0) {
            return rows[0]; // Retorna { nombres: '...', cedula: '...', email: '...' }
        }

        return null; 
        
    } catch (error) {
        console.error('Error al consultar usuario en DB:', error);
        return null; 
    }
};

pool.getConnection()
    .then(connection => {
        console.log('✅ Conexión exitosa a la base de datos MySQL (Chatbot)');
        connection.release();
    })
    .catch(error => {
        console.error('❌ Error conectando a la base de datos:', error.message);
    });