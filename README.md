I have provided all the creds required in the .env file(use accordingly)

To run::

npm init
npx prisma migrate dev --name init
npx prisma db seed
npm start or npm run dev

.env contents::
DATABASE_URL=""
JWT_SECRET=""
PORT=3000
NODE_ENV="development"
JWT_EXPIRES_IN="30d"
