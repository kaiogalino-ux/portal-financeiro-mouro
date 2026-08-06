import { GestaoClickClient, RESOURCES } from '../src/gestaoClickClient.js';

const client = new GestaoClickClient();

const resposta = await client.list(RESOURCES.CLIENTES, { pagina: 1 });
console.log(JSON.stringify(resposta, null, 2));
