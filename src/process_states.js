const { CMD } = require("./constants");
const { exec } = require('child_process');
const { make_cmd_gen, get_para_raw_spec, get_para_id, log } = require("./utils");


async function generate_states(n) {
    log.i('Generating state files..');
    await generate_wasm_states(n);
    await generate_genesis_states(n);
    log.i('State files generated!.');
}

async function generate_wasm_states(n) {
    const bin = process.env.PARA_BIN_PATH;
    const xtra_dir = process.env.XTRA_DIR;
    for(let i=0, cmd=''; i<n; ++i) {
        cmd = make_cmd_gen([
            CMD.GEN_WASM_STATE,
            bin,
            get_para_raw_spec(i),
            `${xtra_dir}para-${get_para_id(i)}-wasm_state`
        ]);
        // log.w('cmd:', cmd);
        await (new Promise((r, j) => exec(cmd, (e, s, ee) => {r()})));
    }
}

async function generate_genesis_states(n) {
    const bin = process.env.PARA_BIN_PATH;
    const xtra_dir = process.env.XTRA_DIR;
    for(let i=0, cmd=''; i<n; ++i) {
        cmd = make_cmd_gen([
            CMD.GEN_GENESIS_STATE,
            bin,
            get_para_raw_spec(i),
            `${xtra_dir}para-${get_para_id(i)}-genesis_state`
        ]);
        await (new Promise((r, j) => exec(cmd, (e, s, ee) => {r()})));
    }
}

module.exports = generate_states;