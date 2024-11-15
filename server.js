const { Client } = require('pg');
const readline = require('readline');

const client = new Client({
  user: 'postgres',      
  host: 'localhost',        
  database: 'limites',    
  password: 'vinimendes',    
  port: 5432,               
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function questionAsync(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

async function createTableAndInsertData() {
  try {
    
    await client.connect();
    console.log('Conectado ao banco de dados!');

    await client.query('BEGIN');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tabela_exemplo (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(50),
        limite DECIMAL(10, 2)
      );
    `;
    await client.query(createTableQuery);
    console.log('Tabela criada ou já existente.');

    const nome = await questionAsync('Digite o nome: ');
    const limiteDebito = await questionAsync('Digite o limite de débito: ');

    const values = [nome, parseFloat(limiteDebito)];
    const insertQuery = 'INSERT INTO tabela_exemplo (nome, limite) VALUES ($1, $2)';

    try {
      const res = await client.query(insertQuery, values);
      console.log('Inserção bem-sucedida:', res.rowCount);

      const confirmacao = await questionAsync('Deseja confirmar a transação? (sim/não): ');

      if (confirmacao.toLowerCase() === 'sim') {
        await client.query('COMMIT');
        console.log('Transação confirmada e salva no banco de dados.');
      } else {
        await client.query('ROLLBACK');
        console.log('Transação revertida. Nenhum dado foi salvo.');
      }
    } catch (error) {
      console.error('Erro ao inserir dados:', error);
      await client.query('ROLLBACK'); 
      console.log('Transação revertida devido a erro.');
    } finally {
      await client.end();
      console.log('Conexão encerrada.');
      rl.close();
    }
  } catch (error) {
    console.error('Erro ao conectar ou criar tabela:', error);
    rl.close();
  }
}

createTableAndInsertData();