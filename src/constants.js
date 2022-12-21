const NAME = {
  PARA: 'para_node_%s',
  RELAY: 'relay_node_%s',
}

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
  NONE: '',
  HELL: ' > dev/null',
  BASE_PARA: './tmp/para/node%s',
  BASE_RELAY: './tmp/relay/node%s',
  RAW_SPEC_RELAY: './specs/relay-raw_spec.json',
  RAW_SPEC_PARA: './specs/para-%s-raw_spec.json',
  PLAIN_SPEC_PARA: './specs/para-plain_spec.json',
  PLAIN_SPEC_RELAY: './specs/relay-plain_spec.json',
}

const SCHEME = {
  ED: 'ed25519',
  SR: 'sr25519',
  ECDSA: 'ecdsa',
}

const KEY_TYPE = {
  AUR: 'aura',
  GRN: 'gran',
  BAB: 'babe',
  IMN: 'imon',
  PRA: 'para',
  ASN: 'asgn',
  AUD: 'audi',
  BFY: 'beef',
}

const CMD = {
  GEN_ACC: ' key generate --network substrate',
  INSP_BEEF: 'key inspect --network substrate --scheme ecdsa',
  INSP_GRAN: 'key inspect --network substrate --scheme sr25519',
  PARA_PLAIN_SPEC: '%s build-spec --disable-default-bootnode > %s',
  RAW_SPEC: '%s build-spec --chain %s --disable-default-bootnode --raw > %s',
  RELAY_PLAIN_SPEC: '%s build-spec --chain rococo-local --disable-default-bootnode > %s',
  INS_KEY: '%s key insert --base-path %s --chain %s --scheme %s --suri "%s" --key-type %s',
  RELAY: '%s --name %s --validator --base-path %s --chain %s --ws-port %s --rpc-port %s --port %s --node-key %s --unsafe-ws-external',
  PARA: '%s --name %s --collator --force-authoring --base-path %s --chain %s --ws-port %s --rpc-port %s --port %s --node-key %s --unsafe-ws-external -- --execution wasm --chain %s --ws-port %s --port %s',
}

module.exports = {
  CMD,
  NAME,
  PORT,
  PATH,
  SCHEME,
  PARA_ID,
  KEY_TYPE
}

