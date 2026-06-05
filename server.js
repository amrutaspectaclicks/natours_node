const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
//console.log(process.env)

//handle uncaught expceptation error

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('UNCAUGHT EXCEPTION , Shutting down...');
  process.exit(1);
});

const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('databae is connected'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log('server started');
});
//handle unhamdled promises(rejected) globally
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION , Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
