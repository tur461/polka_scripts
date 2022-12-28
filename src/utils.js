const util = require('util');
const { exec } = require("child_process");
const { get_ctr } = require('./closures.js');
const { PORT, NAME, CMD, PARA_ID, PATH } = require('./constants.js')


const jObj = v => JSON.parse(v);
const jStr = (v, ...p) => JSON.stringify(v, ...p);


const isObj = v => typeof v === 'object';
const isStr = v => typeof v === 'string';
const isNum = v => typeof v === 'number';

const format = function() { return util.format(...arguments) }

const containsAnyFromArr = (s, arr) => {
  s = s.toLowerCase();
  for(let i=0; i<arr.length; ++i)
    if(s.indexOf(arr[i]) > -1) return !0;
  
  return !1;
}

const log = (_ => {
  return {
    i: function() { console.log(...arguments) },
    w: function() { console.warn(...arguments) },
    e: function() { console.error(...arguments) },
    t: function() { console.trace(...arguments) },
  }
})();

const get_node_key = (ctr, target) => {
  const para = '000000000000000000000000000000000000000000000000%s00000000';
  const relay = '00000000000000000000000000000000000000000000000000000000%s';
  const keyprefix = target === 'r' ? relay : para;
  let fixture = ctr.toString(2);
  fixture = `${'0'.repeat(8 - fixture.length)}${fixture}`;
  return util.format(keyprefix, fixture);
};



const get_port = (ctr, what) => what + ctr; 

const get_relay_raw_spec = _ => PATH.RAW_SPEC_RELAY;

const get_para_plain_spec = _ => PATH.PLAIN_SPEC_PARA;

const get_relay_plain_spec = _ => PATH.PLAIN_SPEC_RELAY;

const get_para_id = ctr => util.format(PARA_ID, ctr);

const get_name_para = ctr => util.format(NAME.PARA, ctr);

const get_name_relay = ctr => util.format(NAME.RELAY, ctr);

const get_base_path = (ctr, what) => util.format(what, ctr);

const get_para_raw_spec = ctr => util.format(PATH.RAW_SPEC_PARA, get_para_id(ctr));

const make_cmd = (params, log_file) => `sh -c '${util.format(...params)} > ${log_file} 2>&1 &'`;

const make_cmd_gen = (params) => `sh -c '${util.format(...params)}'`;

const make_cmd_ins = (params) => `${util.format(...params)}`;

const runShellCmd = cmd => {
    return new Promise((r, j) => {
        exec(`sh -c '${cmd}'`, (err, stdout, stderr) => {
            const res = {
                op: null,
                er: null,
            }
            if (err) res.er = err.message;
            else if (stderr) res.er = stderr;
            else res.op = stdout;
            if(res.op) r(res.op)
            else j(res.er)
        });
    })
}


const parse_op = op => {
  // log.i('op:', op);
  let tmp = op.indexOf('Secret phrase:') + 'Secret phrase:'.length;
  const phrase = op.substring(tmp, op.indexOf('Network ID:')).trim();
  tmp = op.indexOf('SS58 Address:') + 'SS58 Address:'.length;
  const addr = op.substring(tmp).trim();

  // log.i(phrase, addr);
  return {phrase, addr};
}

module.exports = {
    log,
    jObj,
    jStr,
    isObj,
    isStr,
    isNum,
    format,
    parse_op,
    get_port,
    make_cmd,
    runShellCmd,
    get_para_id,
    make_cmd_gen,
    make_cmd_ins,
    get_node_key,
    get_base_path,
    get_name_para,
    get_name_relay,
    get_para_raw_spec,
    get_relay_raw_spec,
    containsAnyFromArr,
    get_para_plain_spec,
    get_relay_plain_spec,
}