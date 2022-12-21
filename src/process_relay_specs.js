const { exec } = require('child_process');
const fs = require('fs');
const { CMD, PATH } = require('./constants');
const { 
    log, 
    jObj,
    jStr,
    isObj,
    runShellCmd,
    parse_op,
    make_cmd_gen,
    format,
} = require('./utils');

let para = null;
let RELAY_BIN = '';
let RELAY_PLAIN_SPEC_PATH = '';

const FILE_PATH = { 
    PHRASES_CONTR: './relay_phrases_contr.txt',
    PHRASES_STASH: './relay_phrases_stash.txt',
}

async function run_relay_spec_code() {
    RELAY_BIN = process.env.RELAY_BIN_PATH;
    RELAY_PLAIN_SPEC_PATH = process.env.RELAY_PLAIN_SPEC_PATH;

    await generate_relay_plain_spec();
    para = jObj(fs.readFileSync(RELAY_PLAIN_SPEC_PATH));
    await process_spec();
    await generate_relay_raw_spec();
}

function generate_relay_plain_spec() {
    let cmd = make_cmd_gen([
        CMD.RELAY_PLAIN_SPEC,
        RELAY_BIN,
        PATH.PLAIN_SPEC_RELAY,
    ])
    // generate relay plain spec
    return new Promise((r, j) => exec(cmd, (e, s, ee) => {r()}));
}

function generate_relay_raw_spec() {
    let cmd = make_cmd_gen([
        CMD.RAW_SPEC,
        RELAY_BIN,
        PATH.PLAIN_SPEC_RELAY,
        PATH.RAW_SPEC_RELAY,
    ])
    // generate relay plain spec
    return new Promise((r, j) => exec(cmd, (e, s, ee) => {r()}));
}

async function process_spec() {
    if(isObj(para)) {
        resetFiles()
        log.i('getting stash accounts');
        const config = para.genesis.runtime.runtime_genesis_config;
        const bals = config.balances.balances;
        const numOfAccs = bals.length;
        const bal = bals[0][1];
        let d = await getStashAccounts(numOfAccs/2);
        const accsStash = d.accs;
        const stashPhrases = d.phrases;
        d = await getControllerAccounts(numOfAccs/2);
        const accsController = d.accs;
        const contrPhrases = d.phrases;
        bals.length = 0;
        
        // insert controller accounts
        for(let i=0; i<numOfAccs/2; ++i) {
            bals.push([accsController[i], bal]);
        }

        // insert stash accounts
        for(let i=0; i<numOfAccs/2; ++i) {
            bals.push([accsStash[i], bal]);
        }

        // session -> keys

        const sessKeys = config.session.keys;
        const sessKeysLen = sessKeys.length;
        sessKeys.length = 0;

        for(let i=0; i<sessKeysLen; ++i) {
            sessKeys.push([
                accsStash[i],
                accsStash[i],
                {
                    grandpa: await getGrandpa(stashPhrases[i]),
                    babe: accsController[i],
                    im_online: accsController[i],
                    para_validator: accsController[i],
                    para_assignment: accsController[i],
                    authority_discovery: accsController[i],
                    beefy: await getBeefy(contrPhrases[i]),
                }
            ]);
        }

        // sudo -> key

        config.sudo.key = accsController[0];
        // config.bridgeRococoGrandpa.owner = accsController[0];
        // config.bridgeWococoGrandpa.owner = accsController[0];
        // config.bridgeRococoMessages.owner = accsController[0];
        // config.bridgeWococoMessages.owner = accsController[0];


        writeMutatedSpec(para, RELAY_PLAIN_SPEC_PATH);
    }
}

async function getStashAccounts(howMany) {
    let accs = [], phrases = []
    log.i('how many:', howMany);
    for(let i=0, d={}; i<howMany; ++i) {
        d = parse_op(await runShellCmd(`${RELAY_BIN} ${CMD.GEN_ACC}`));
        accs.push(d.addr);
        phrases.push(d.phrase);
        storeToFile(d.phrase, FILE_PATH.PHRASES_STASH);
    }
    return {accs, phrases};
}

async function getControllerAccounts(howMany) {
    let accs = [], phrases = [];
    log.i('how many:', howMany);
    for(let i=0, d={}; i<howMany; ++i) {
        d = parse_op(await runShellCmd(`${RELAY_BIN} ${CMD.GEN_ACC}`));
        accs.push(d.addr);
        phrases.push(d.phrase);
        storeToFile(d.phrase, FILE_PATH.PHRASES_CONTR);
    }
    return {accs, phrases};
}

function parseBeefy(op) {
    let tmp = op.indexOf('Public key (SS58):') + 'Public key (SS58):'.length;
    const c = op.substring(tmp, op.indexOf('SS58 Address:')).trim();
    return c;
}

function parseGrandpa(op) {
    let tmp = op.indexOf('SS58 Address:') + 'SS58 Address:'.length;
    const c = op.substring(tmp).trim();
    return c;
}

async function getBeefy(ctrPhrase) {
    return parseBeefy(await runShellCmd(`${RELAY_BIN} ${CMD.INSP_BEEF} "${ctrPhrase}"`));
}

async function getGrandpa(stashPhrase) {
    return parseGrandpa(await runShellCmd(`${RELAY_BIN} ${CMD.INSP_GRAN} "${stashPhrase}"`));
}

function storeToFile(data, path) {
    fs.appendFileSync(path, `${data.trim()}\n`);
}

function resetFiles() {
    fs.writeFileSync(FILE_PATH.PHRASES_CONTR, '')
    fs.writeFileSync(FILE_PATH.PHRASES_STASH, '');
}

function writeMutatedSpec(data, path) {
    fs.writeFileSync(path, jStr(data, null, 2));
}

module.exports = run_relay_spec_code;