const util = require('util');
const { get_ctr } = require('./closures.js');
const { PORT, NAME, CMD, PARA_ID } = require('./constants.js')

const get_node_key = (ctr, target) => {
  const para = '000000000000000000000000000000000000000000000000%s00000000';
  const relay = '00000000000000000000000000000000000000000000000000000000%s';
  const keyprefix = target === 'r' ? relay : para;
  let fixture = ctr.toString(2);
  fixture = `${'0'.repeat(8 - fixture.length)}${fixture}}`;
  return util.format(keyprefix, fixture);
};


const get_name = ctr => util.format(NAME, ctr);

const get_port = (ctr, what) => what + ctr - 1; 

const get_para_id = ctr => util.format(PARA_ID, ctr);

const get_base_path = (ctr, what) => util.format(what, ctr);

const get_spec = (ctr, what) => util.format(what, get_para_id(ctr));

const make_cmd = (bin, params, log_file) => `sh -c '${bin} ${util.format(...params)} > ${log_file} 2>&1 &'`;

module.exports = {
  get_port,
  get_name,
  make_cmd,
  get_spec,
  get_para_id,
  get_node_key,
  get_base_path,
}

