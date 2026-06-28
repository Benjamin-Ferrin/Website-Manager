const pool = require('../src/db/pool');

async function dropAllTables() {
  try {
    console.log('Dropping all tables...');
    
    // Get all table names
    const result = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = result.rows.map(row => row.tablename);
    
    if (tables.length === 0) {
      console.log('No tables to drop.');
    } else {
      console.log('Found tables:', tables);
      
      // Drop each table
      for (const table of tables) {
        await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`Dropped table: ${table}`);
      }
    }
    
    // Drop all enum types
    console.log('Dropping all enum types...');
    const enumResult = await pool.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    const enums = enumResult.rows.map(row => row.typname);
    
    if (enums.length === 0) {
      console.log('No enum types to drop.');
    } else {
      console.log('Found enum types:', enums);
      
      for (const enumName of enums) {
        await pool.query(`DROP TYPE IF EXISTS ${enumName} CASCADE`);
        console.log(`Dropped enum type: ${enumName}`);
      }
    }
    
    console.log('All tables and enum types dropped successfully.');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

dropAllTables();
