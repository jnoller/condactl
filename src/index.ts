
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { API } from './api';
import { CLI } from './cli';

dotenv.config();

const app = express();
app.use(bodyParser.json());

const api = new API();
api.registerRoutes(app);

const cli = new CLI();
cli.registerCommands();

const port = process.env.PORT || 3000;
app.listen(port, () => {
console.log(`Server is running on port ${port}`);
});