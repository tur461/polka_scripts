const fs = require('fs');
const util = require('util');
const { exec } = require('child_process');
const { CMD, PATH } = require('./constants');
const { 
    log,
    jObj,
    jStr,
    isObj,
    format,
    parse_op,
    runShellCmd,
    get_para_id,
    make_cmd_gen,
    get_para_raw_spec,
} = require('./utils');


let PHRASES_CONTR = '';
let PHRASES_STASH =  '';

let PARA_BIN = '';
let RELAY_BIN = '';
let PARA_PLAIN_SPEC_PATH = '';

let para = null;

async function run_para_spec_code(n) {
    PARA_BIN =  process.env.PARA_BIN_PATH;
    RELAY_BIN = process.env.RELAY_BIN_PATH;
    PHRASES_STASH = process.env.PARA_PHRASES_STASH;
    PHRASES_CONTR = process.env.PARA_PHRASES_CONTR;
    PARA_PLAIN_SPEC_PATH = process.env.PARA_PLAIN_SPEC_PATH;
    
    await generate_para_plain_spec();
    para = jObj(fs.readFileSync(PARA_PLAIN_SPEC_PATH));
    await process_spec(n);
    await generate_para_raw_specs(n);
}

async function generate_para_plain_spec() {
    let cmd = make_cmd_gen([
        CMD.PARA_PLAIN_SPEC,
        PARA_BIN,
        PATH.PLAIN_SPEC_PARA,
    ])
    // generate para plain spec
    return new Promise((r, j) => exec(cmd, (e, s, ee) => {r()}));
}

async function generate_para_raw_specs(n) {
    // let p = [];
    for (let i=0, cmd='', para_id=0; i<n; ++i) {
        para_id = +get_para_id(i);
        upsert_para_id(para_id);
        cmd = make_cmd_gen([
            CMD.RAW_SPEC,
            PARA_BIN,
            PATH.PLAIN_SPEC_PARA,
            get_para_raw_spec(i),
        ]);
        await (new Promise((r, j) => exec(cmd, (e, s, ee) => {r()})));
    }
    // return Promise.all(p);
}

function upsert_para_id(para_id) {
    // log.i('para_id', para_id);
    para.para_id = para_id;
    para.genesis.runtime.parachainInfo.parachainId = para_id;
    write_mutated_spec(para, PATH.PLAIN_SPEC_PARA);
}

async function process_spec(n) {
    if(isObj(para)) {
        log.i('processing para specs, n:', n);
        reset_files();
        const bals = para.genesis.runtime.balances.balances;
        let numOfAccs = bals.length / 2;
        
        if (numOfAccs < n) numOfAccs += (n-numOfAccs);
        
        const bal = bals[0][1];
        log.i('generating accounts, #:', numOfAccs);
        const accsStash = await get_stash_accounts(numOfAccs);
        const accsController = await get_controller_accounts(numOfAccs);
        log.i(`Accs generated!. stash: ${accsStash.length}, controller: ${accsController.length}`);
        // reset rev balanaces list
        bals.length = 0;
       
        // insert controller accounts
        for(let i=0; i<numOfAccs; ++i) bals.push([accsController[i], bal]);

        // insert stash accounts
        for(let i=0; i<numOfAccs; ++i) bals.push([accsStash[i], bal]);

        // collatorSelection -> invulnerables

        const invulns = para.genesis.runtime.collatorSelection.invulnerables;
        const invLen = invulns.length;
        // reset prev list
        invulns.length = 0;

        for(let i=0; i<invLen; ++i) invulns.push(accsStash[i]);

        // session -> keys

        const sessKeys = para.genesis.runtime.session.keys;
        const sessKeysLen = sessKeys.length;
        // reset prev list
        sessKeys.length = 0;

        for(let i=0; i<n; ++i) {
            log.i(`spec session key at i: ${i}`);
            sessKeys.push([
                accsStash[i],
                accsStash[i],
                {
                    aura: accsStash[i]
                }
            ]);
        }


        write_mutated_spec(para, PATH.PLAIN_SPEC_PARA);
    }
}

async function get_stash_accounts(howMany) {
    let accs = [];
    // log.i('how many:', howMany);
    for(
        let i=0, d={};
        i<howMany; 
        storeToFile(d.phrase, PHRASES_STASH), accs.push(d.addr), ++i
    ) d = parse_op(await runShellCmd(`${RELAY_BIN} ${CMD.GEN_ACC}`))
    return accs;
}

async function get_controller_accounts(howMany) {
    let accs = []
    // log.i('how many:', howMany);
    for(
        let i=0, d={}; 
        i<howMany; 
        storeToFile(d.phrase, PHRASES_CONTR), accs.push(d.addr), ++i
    ) d = parse_op(await runShellCmd(`${RELAY_BIN} ${CMD.GEN_ACC}`))
    return accs;
}

function storeToFile(data, path) {
    fs.appendFileSync(path, `${data.trim()}\n`);
}

function reset_files() {
    fs.writeFileSync(PHRASES_CONTR, '')
    fs.writeFileSync(PHRASES_STASH, '');
}

function write_mutated_spec(data, path) {
    fs.writeFileSync(
        path, 
        jStr(data, null, 2), 
        { flag: 'w' }
    );
}

module.exports = run_para_spec_code;