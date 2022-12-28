const { exec } = require('child_process');
const fs = require('fs');
const { CMD, PATH, SCHEME, KEY_TYPE, PORT } = require('./constants');
const { get_base_path, make_cmd_gen, log, get_port, format, containsAnyFromArr, make_cmd_ins } = require('./utils');

let ivl = [];

async function insert_keys(op) {
    await into_para_nodes(op.numOfNodes_para);
    await into_relay_nodes(op.numOfNodes_relay);
}

async function into_para_nodes(n) {
    log.i('inserting session keys into para nodes.');
    const PARA_PHRASES_STASH = process.env.PARA_PHRASES_STASH
    log.i(PARA_PHRASES_STASH);
    const sPhrases = fs.readFileSync(PARA_PHRASES_STASH).toString().trim().split("\n");
    let pubKeys = await Promise.all(sPhrases.map((ph, i) => get_pub_key(ph, i)));
    pubKeys = pubKeys.sort((a, b) => a < b ? -1 : a > b ? 1 : 0).map(p => p.pub);
    log.i('pubkeys:', pubKeys);
    const err = ['failed', 'after', 'refused'];
    const suc = ['result', 'id', 'jsonrpc'];
    for(let p=[], i=0, cmd=''; i<n; ++i) {
        ivl.push(
            setInterval(_ => {
                ping_node(i, async (e, s, ee) => {
                    // log.i('got s:', s);
                    if(containsAnyFromArr(s, err)) {
                        log.i('retrying..');
                    } else if(containsAnyFromArr(s, suc)) {
                        log.i('pingged');
                        p = [
                            CMD.INS_KEY_PARA,
                            sPhrases[i],
                            pubKeys[i],
                            get_port(i, PORT.PARA.RPC)
                        ]
                        cmd = make_cmd_ins(p);
                        await (
                            new Promise(
                                (r,_) => exec(cmd, (e, s, ee) => {
                                    log.i(e);
                                    log.i(s);
                                    log.i(ee);
                                    r()
                                })
                            )
                        );
                        clearInterval(ivl[i]);
                    } 
                }   )
            }, 500)
        );
    }
}

async function into_relay_nodes(n) {
    const bin = process.env.RELAY_BIN_PATH;
    log.i('inserting session keys into relay nodes using:', bin);
    const RELAY_PHRASES_CONTR = process.env.RELAY_PHRASES_CONTR;
    const RELAY_RAW_SPEC_PATH = process.env.RELAY_RAW_SPEC_PATH;
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


function ping_node(i, cbk) {
    //curl: (7) Failed to connect to localhost port 9256 after 4 ms: Connection refused
    log.i('pinging para node # ' + i);
    
    exec(format(CMD.PING_NODE, get_port(i, PORT.PARA.RPC)), cbk);
}

async function do_exec(p) {
    const cmd = make_cmd_gen(p);
    await (
        new Promise(
            (r,_) => exec(cmd, (e, s, ee) => r())
        )
    );
}

async function get_pub_key(phrase, i) {
    const bin = process.env.RELAY_BIN_PATH;
    const p = [
        CMD.INSP_AURA,
        bin,
        phrase
    ]
    const cmd = make_cmd_gen(p);
    
    return new Promise(
        (r,_) => exec(cmd, (e, s, ee) => {
            if(e) _();
            s = s.toString();
            let ii = s.indexOf('Public key (hex):') + 'Public key (hex):'.length;
            s = s.substring(ii, s.indexOf('Account ID:')).trim();

            r({pub: s, seq: i});
        })
    )
}

module.exports = insert_keys;