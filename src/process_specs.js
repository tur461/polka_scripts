const run_para_spec_code = require('./process_para_specs');
const run_relay_spec_code = require('./process_relay_specs');

const process_all_specs = async op => {
    const np = op.numOfNodes_para;
    const nr = op.numOfNodes_relay;

    await run_para_spec_code(np);
    await run_relay_spec_code();
}

module.exports = process_all_specs;