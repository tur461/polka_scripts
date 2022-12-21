const util = require('util');
require('dotenv').config()
const { exec }  = require('child_process')
const { get_node_key, get_ctr } = require('./closures.js');
const { CMD, PATH, PORT } = require('./constants.js');
const { get_name, make_cmd, get_port } = require('./utils.js');

const LOG_DIR = process.env.LOG_DIR;

main()

function main() {
  console.log('env', process.env);
  const numOfNodes_para = process.env.NUM_OF_PARA_NODES;
  console.log(numOfNodes_para, 'numOfNodes_para')
  if(!numOfNodes_para) throw new Error('provide num of para nodes in env file ');
  
  const numOfNodes_relay = +process.env.NUM_OF_RELAY_NODES;
  if(!numOfNodes_relay) throw new Error('provide num of para nodes in env file');
  
  run_relay_nodes(numOfNodes_relay);
}

function run_relay_nodes(n) {
  const bin = process.env.PARA_BIN_PATH;
  console.log(util.format('running %s relay nodes..', n))
  for(ctr=0, params=[]; n--;) {
    ctr = get_ctr();
    params = [
      CMD.RELAY,
      bin,
      get_name(ctr),
      get_base_path(ctr, PATH.BASE_RELAY),
      get_spec(ctr, PATH.RAW_SPEC_RELAY),
      get_port(ctr, PORT.RELAY.WS),
      get_port(ctr, PORT.RELAY.RPC),
      get_port(ctr, PORT.RELAY.HTTP),
      get_node_key(ctr, 'r'),
    ]
    
    const log_dir = `${LOG_DIR}relay_${ctr}.log`;
    
    exec(make_cmd(ctr, params, log_dir), (e, s, ee) => {
      if (!e || !ee) console.log(util.format('node %s running.. [check log ./log/relay_%s]', ctr, ctr));
      else console.log('error running node ' + ctr);
    })
  }
}
