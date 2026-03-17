require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

// CONFIGURACIÓN IMPORTANTE
app.use(cors());
app.use(express.json()); // Permite recibir datos en los botones + y -

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {rejectUnauthorized: false }
});

// LISTAR
app.get('/api/repuestos', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM repuestos ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AGREGAR NUEVO
app.post('/api/repuestos', async (req, res) => {
  try {
    const { categoria, nombre_tecnico, alias_comun, stock_actual, stock_minimo, ubicacion } = req.body;
    const query = 'INSERT INTO repuestos (categoria, nombre_tecnico, alias_comun, stock_actual, stock_minimo, ubicacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const valores = [categoria, nombre_tecnico, alias_comun, stock_actual, stock_minimo, ubicacion];
    const resultado = await pool.query(query, valores);
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/repuestos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Intentando eliminar el ID: ${id}`); // Esto saldrá en tu terminal
    const resultado = await pool.query('DELETE FROM repuestos WHERE id = $1', [id]);
    
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: "No se encontró el producto" });
    }
    
    res.json({ mensaje: "Eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ACTUALIZAR STOCK (+1 / -1)
app.patch('/api/repuestos/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    const query = 'UPDATE repuestos SET stock_actual = stock_actual + $1 WHERE id = $2 RETURNING *';
    const resultado = await pool.query(query, [cantidad, id]);
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para ACTUALIZAR un producto completo (Editar)
app.put('/api/repuestos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { categoria, nombre_tecnico, alias_comun, stock_actual, stock_minimo, ubicacion } = req.body;
    
    const query = `
      UPDATE repuestos 
      SET categoria = $1, nombre_tecnico = $2, alias_comun = $3, 
          stock_actual = $4, stock_minimo = $5, ubicacion = $6 
      WHERE id = $7 RETURNING *`;
    
    const valores = [categoria, nombre_tecnico, alias_comun, stock_actual, stock_minimo, ubicacion, id];
    const resultado = await pool.query(query, valores);
    
    res.json(resultado.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor listo en el puerto ${port}`);
});

