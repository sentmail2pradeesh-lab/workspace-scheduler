const pool = require('./pool');

async function migrate() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN NOT NULL DEFAULT TRUE;
    ALTER TABLE users ALTER COLUMN mobile DROP NOT NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      mobile VARCHAR(20),
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('Standard', 'Supervisor')),
      otp_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE otp_verifications ALTER COLUMN mobile DROP NOT NULL`);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
  `);

  await pool.query(`
    DO $$ BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mobile_key;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mobile_unique ON users(mobile) WHERE mobile IS NOT NULL;
  `);

  console.log('Database migration completed.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
