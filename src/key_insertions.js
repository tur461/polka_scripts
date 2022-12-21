const { exec } = require('child_process');
const fs = require('fs');
const { CMD, PATH, SCHEME, KEY_TYPE } = require('./constants');
const { get_base_path, get_para_raw_spec, make_cmd_gen, log } = require('./utils');

async function insert_keys(op) {
    await into_para_nodes(op.numOfNodes_para);
    await into_relay_nodes(op.numOfNodes_relay);
}

async function into_para_nodes(n) {
    const bin = process.env.PARA_BIN_PATH;
    const PARA_PHRASES_STASH = process.env.PARA_PHRASES_STASH
    log.i(PARA_PHRASES_STASH);
    const sPhrases = fs.readFileSync(PARA_PHRASES_STASH).toString().trim().split("\n");

    for(let p=[], i=0, cmd=''; i<n; ++i) {
        p = [
            CMD.INS_KEY,
            bin,
            get_base_path(i, PATH.BASE_PARA),
            get_para_raw_spec(i),
            SCHEME.SR,
            sPhrases[i],
            KEY_TYPE.AUR
        ]
        cmd = make_cmd_gen(p);
        await (
            new Promise(
                (r,_) => exec(cmd, (e, s, ee) => r())
            )
        );
    }
}

async function into_relay_nodes(n) {
    const bin = process.env.RELAY_BIN_PATH;
    // const RELAY_PHRASES_STASH = process.env.RELAY_PHRASES_STASH;
    const RELAY_PHRASES_CONTR = process.env.RELAY_PHRASES_CONTR;
    const RELAY_RAW_SPEC_PATH = process.env.RELAY_RAW_SPEC_PATH;
    // const sPhrases = fs.readFileSync(PARA_PHRASES_STASH).trim().toString().split("\n");
    const cPhrases = fs.readFileSync(RELAY_PHRASES_CONTR).toString().trim().split("\n");

    for(let p=[], i=0; i<n; ++i) {
        // gran
        p = [
            CMD.INS_KEY,
            bin,
            get_base_path(i, PATH.BASE_RELAY),
            RELAY_RAW_SPEC_PATH,
            SCHEME.ED,
            cPhrases[i],
            KEY_TYPE.GRN
        ]
        await do_exec(p);
        // babe
        p[4] = SCHEME.SR;
        p[6] = KEY_TYPE.BAB;
        await do_exec(p);
        // imon
        p[6] = KEY_TYPE.IMN;
        await do_exec(p);
        // para
        p[6] = KEY_TYPE.PRA;
        await do_exec(p);
        // asgn
        p[6] = KEY_TYPE.ASN;
        await do_exec(p);
        // audi
        p[6] = KEY_TYPE.AUD;
        await do_exec(p);
        // beefy
        p[4] = SCHEME.ECDSA;
        p[5] = cPhrases[i];
        p[6] = KEY_TYPE.BFY;
        await do_exec(p);
    }
}

async function do_exec(p) {
    const cmd = make_cmd_gen(p);
    await (
        new Promise(
            (r,_) => exec(cmd, (e, s, ee) => r())
        )
    );
}

module.exports = insert_keys;