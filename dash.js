/*import express from 'express';
import { dirname } from 'path';
import { EventEmitter } from "node:events"

const event = new EventEmitter();
const app = express();

//__dirname is not defined in ES6 modules
const __dirname = dirname(import.meta.url).replace('file:///', '');

app.get('/', (req, res) => {
    //res.sendFile(__dirname + '/index.html');
});

const ln = async() => app.listen;

export { ln, event };
*/