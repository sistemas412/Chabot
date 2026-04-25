import { pool } from '../config/db'; 

export const checkUserInDB = async (telefono: string) => {
    try {
        // Importante: Si en el bot buscas .nombres, asegúrate de que el SQL devuelva eso
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
        return null; // Es mejor retornar null en errores de DB para que el bot simplemente pida registro
    }
};