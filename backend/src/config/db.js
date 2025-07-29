import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// Creates a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id serial PRIMARY KEY,
        user_id varchar(255) NOT NULL,
        title varchar(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        category varchar(255) NOT NULL,
        created_at date NOT NULL DEFAULT CURRENT_DATE)
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializaing DB", error);
    process.exit(1); // status code 1 means failure, 0 success
  }
}