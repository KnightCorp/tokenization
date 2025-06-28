I have provided all the creds required in the .env file(use accordingly)

To run::

  1.npm init
  2.npx prisma migrate dev --name init
  3.npx prisma db seed
  4.npm start or npm run dev

.env contents::
  DATABASE_URL=""
  
  JWT_SECRET=""

  PORT=3000

  NODE_ENV="development"

  JWT_EXPIRES_IN="30d"
