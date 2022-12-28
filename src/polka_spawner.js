
const util = require('util');
const dotenv =  require('dotenv');
const { exec }  = require('child_process')
const { get_ctr } = require('./closures');
const insert_keys = require('./key_insertions');
const process_all_specs = require('./process_specs');
const { 
  CMD, 
  PATH, 
  PORT 
} = require('./constants');
const { 
  get_port,
  make_cmd,
  get_node_key,
  get_base_path,
  get_name_para,
  get_name_relay,
  get_para_raw_spec,
  get_relay_raw_spec,
  log,
} = require('./utils');
const generate_states = require('./process_states');

dotenv.config({ path: 'scripts/.env'});

const LOG_DIR = process.env.LOG_DIR;

main().then();

async function main() {
  const numOfNodes_para = process.env.NUM_OF_PARA_NODES;
  
  if(!numOfNodes_para) throw new Error('provide num of para nodes in env file ');
  
  const numOfNodes_relay = +process.env.NUM_OF_RELAY_NODES;
  if(!numOfNodes_relay) throw new Error('provide num of para nodes in env file');
  const p = {
    numOfNodes_para, 
    numOfNodes_relay
  };

  // generate keys and process spec files
  await process_all_specs(p);

  const do_clean = process.env.DO_CLEAN;
  if(+do_clean) {
    // start with clean environment
    await reset_logs();
    await reset_xtras();
    await reset_base_paths();
  }

  // generate parachain states for registration on relaychain
  await generate_states(numOfNodes_para);
  
  run_relay_nodes(numOfNodes_relay);
  run_para_nodes(numOfNodes_para);

  // insert keys
  await insert_keys(p);

  // stop nodes
  await stop_all_nodes();

  // restart nodes
  run_relay_nodes(numOfNodes_relay);
  run_para_nodes(numOfNodes_para);
}

function run_relay_nodes(n) {
  const bin = process.env.RELAY_BIN_PATH;
  console.log(util.format('running %s relay nodes..', n))
  for(ctr=0, params=[]; n--; ctr=get_ctr()) {
    params = [
      CMD.RELAY,
      bin,
      get_name_relay(ctr),
      get_base_path(ctr, PATH.BASE_RELAY),
      get_relay_raw_spec(),
      get_port(ctr, PORT.RELAY.WS),
      get_port(ctr, PORT.RELAY.RPC),
      get_port(ctr, PORT.RELAY.HTTP),
      get_node_key(ctr, 'r'),
    ]
    
    const log_file = `${LOG_DIR}relay_${ctr}.log`;
    const cmd = make_cmd(params, log_file);
    // console.log(cmd);
    exec(cmd, (e, s, ee) => {
      if (!e || !ee) console.log(util.format('node %s running.. [check log ./log/relay_%s.log]', ctr, ctr));
      else console.log('error running node ' + ctr);
    })
  }
}

function run_para_nodes(n) {
  const bin = process.env.PARA_BIN_PATH;
  const RELAY_RAW_SPEC = process.env.RELAY_RAW_SPEC_PATH;
  console.log(util.format('running %s para nodes..', n))
  for(ctr=get_ctr(0), params=[]; n--; ctr = get_ctr()) {
    params = [
      CMD.PARA,
      bin,
      get_name_para(ctr),
      get_base_path(ctr, PATH.BASE_PARA),
      get_para_raw_spec(ctr),
      get_port(ctr, PORT.PARA.WS),
      get_port(ctr, PORT.PARA.RPC),
      get_port(ctr, PORT.PARA.HTTP),
      get_node_key(ctr, 'p'),
      RELAY_RAW_SPEC,
      get_port(ctr, PORT.EMBBED.WS),
      get_port(ctr, PORT.EMBBED.HTTP),
    ]
    const log_file = `${LOG_DIR}para_${ctr}.log`;
    const cmd = make_cmd(params, log_file);
    // log.i(cmd);
    exec(cmd, (e, s, ee) => {
      // if (!e || !ee) console.log(util.format('node %s running.. [check log ./log/para_%s.log]', ctr+1, ctr));
      // else console.log('error running node ' + (ctr+1));
    })
  }
}

async function reset_logs() {
  log.i('cleaning logs..');
  await (
    new Promise(
      (r, j) => exec(`rm ${process.env.LOG_DIR}*`, (e, s, ee) => r())
    )
  );
}

async function reset_xtras() {
  log.i('cleaning xtras..');
  await (
    new Promise(
      (r, j) => exec(`rm ${process.env.XTRA_DIR}*`, (e, s, ee) => r())
    )
  );
}

async function reset_base_paths() {
  log.i('cleaning tmp..');
  await (
    new Promise(
      (r, j) => exec(`rm -rf ${process.env.BASE_PATH}*`, (e, s, ee) => r())
    )
  );
}

async function stop_all_nodes() {
  log.w('stopping all running nodes..');
  await (
    new Promise(
      (r, j) => exec(`pkill -9 -f relay && pkill -9 -f para`, (e, s, ee) => r())
    )
  );
}