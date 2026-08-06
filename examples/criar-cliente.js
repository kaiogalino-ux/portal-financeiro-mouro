import { GestaoClickClient, RESOURCES } from '../src/gestaoClickClient.js';

const client = new GestaoClickClient();

const novoCliente = {
  nome: 'Cliente de Teste',
  tipo_pessoa: 'PF',
  cpf: '00000000000',
  email: 'teste@example.com',
};

const resposta = await client.create(RESOURCES.CLIENTES, novoCliente);
console.log(JSON.stringify(resposta, null, 2));
