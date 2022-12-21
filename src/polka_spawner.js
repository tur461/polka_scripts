
const util = require('util');
const dotenv =  require('dotenv');
const { exec }  = require('child_process')
const { get_ctr } = require('./closures.js');
const { 
  CMD, 
  PATH, 
  PORT 
} = require('./constants.js');
const { 
  get_port,
  get_name,
  make_cmd,
  get_node_key,
  get_base_path,
  get_relay_spec, 
} = require('./utils.js');

dotenv.config({ path: 'scripts/.env'});

const LOG_DIR = process.env.LOG_DIR;

main()

function main() {
  const numOfNodes_para = process.env.NUM_OF_PARA_NODES;
  console.log(numOfNodes_para, 'numOfNodes_para')
  if(!numOfNodes_para) throw new Error('provide num of para nodes in env file ');
  
  const numOfNodes_relay = +process.env.NUM_OF_RELAY_NODES;
  if(!numOfNodes_relay) throw new Error('provide num of para nodes in env file');
  
  run_relay_nodes(numOfNodes_relay);
}

function run_relay_nodes(n) {
  const bin = process.env.RELAY_BIN_PATH;
  console.log(util.format('running %s relay nodes..', n))
  for(ctr=0, params=[]; n--;) {
    ctr = get_ctr();
    params = [
      CMD.RELAY,
      bin,
      get_name(ctr),
      get_base_path(ctr, PATH.BASE_RELAY),
      get_relay_spec(),
      get_port(ctr, PORT.RELAY.WS),
      get_port(ctr, PORT.RELAY.RPC),
      get_port(ctr, PORT.RELAY.HTTP),
      get_node_key(ctr, 'r'),
    ]
    
    const log_file = `${LOG_DIR}relay_${ctr}.log`;
    const cmd = make_cmd(params, log_file);
    console.log(cmd);
    exec(cmd, (e, s, ee) => {
      if (!e || !ee) console.log(util.format('node %s running.. [check log ./log/relay_%s.log]', ctr, ctr));
      else console.log('error running node ' + ctr);
    })
  }
}
