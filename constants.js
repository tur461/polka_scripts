const NAME = 'node%s';

const PARA_ID = '200%s';

const PORT = {
  PARA: {
    WS: 9000,
    RPC: 9256,
    HTTP: 30000,
  },
  RELAY: {
    WS: 9512,
    RPC: 9768,
    HTTP: 30256,
  },
  EMBBED: {
    WS: 8400,
    RPC: 8656,
    HTTP: 20000,
  }
}

const PATH = {
  BASE_PARA: './tmp/para/%s',
  BASE_RELAY: './tmp/relay/%s',
  RAW_SPEC_PARA: './specs/para-%s-raw_spec.json',
  RAW_SPEC_RELAY: './spec/relay-raw_spec.json',
}

const CMD = {
  RELAY: '%s --name %s --validator --base-path %s --chain %s --ws-port %s --rpc-port %s --port %s --node-key %s --ws-external',
  PARA: '%s --name --collator --force-authoring --chain %s --base-path %s --port %s --ws-port %s --ws-external -- --execution wasm --chain %s --port %s --ws-port %s',
}

module.exports = {
  CMD,
  NAME,
  PORT,
  PATH,
  PARA_ID,
}

