const fs = require('fs');
const { jObj, jStr, isObj, runShellCmd } = require('./utils');

const RELAY_BIN = process.env.RELAY_BIN_PATH;

const CMD = {
    GEN_ACC: `${RELAY_BIN} key generate --network substrate`,
    INSP_BEEF: `${RELAY_BIN} key inspect --network substrate --scheme ecdsa`,
    INSP_GRAN: `${RELAY_BIN} key inspect --network substrate --scheme sr25519`,
}

const FILE_PATH = { 
    PHRASES_CONTR: './relay_phrases_contr.txt',
    PHRASES_STASH: './relay_phrases_stash.txt',
    RELAY_SPEC_MOD: './specs/relay_spec-modified.json',
    RELAY_SPEC_PATH: './specs/relay-plain_spec.json',
}

async function main() {
    console.log('running');
    const para = jObj(fs.readFileSync(FILE_PATH.RELAY_SPEC_PATH));

    if(isObj(para)) {
        resetFiles()
        console.log('getting stash accounts');
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
        config.bridgeRococoGrandpa.owner = accsController[0];
        config.bridgeWococoGrandpa.owner = accsController[0];
        config.bridgeRococoMessages.owner = accsController[0];
        config.bridgeWococoMessages.owner = accsController[0];


        writeMutatedSpec(para, FILE_PATH.RELAY_SPEC_MOD);
    }
}

async function getStashAccounts(howMany) {
    let accs = [], phrases = []
    console.log('how many:', howMany);
    for(let i=0, d={}; i<howMany; ++i) {
        d = parse(await runShellCmd(CMD.GEN_ACC));
        accs.push(d.addr);
        phrases.push(d.phrase);
        storeToFile(d.phrase, FILE_PATH.PHRASES_STASH);
    }
    return {accs, phrases};
}

async function getControllerAccounts(howMany) {
    let accs = [], phrases = [];
    console.log('how many:', howMany);
    for(let i=0, d={}; i<howMany; ++i) {
        d = parse(await runShellCmd(CMD.GEN_ACC));
        accs.push(d.addr);
        phrases.push(d.phrase);
        storeToFile(d.phrase, FILE_PATH.PHRASES_CONTR);
    }
    return {accs, phrases};
}

function parse(op) {
    const phrase = op.match(/Secret phrase `(.*)`/)[1].trim();
    const addr = op.match(/SS58 Address: (.*)/)[1].trim();

    console.log(phrase, addr);
    return {phrase, addr};
}

function parseBeefy(op) {
    const c = op.match(/Public key \(SS58\): (.*)\n/)[1].trim();
    return c;
}

function parseGrandpa(op) {
    return op.match(/SS58 Address: (.*)/)[1].trim();
}

async function getBeefy(ctrPhrase) {
    return parseBeefy(await runShellCmd(`${CMD.INSP_BEEF} "${ctrPhrase}"`));
}

async function getGrandpa(stashPhrase) {
    return parseGrandpa(await runShellCmd(`${CMD.INSP_GRAN} "${stashPhrase}"`));
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

main().then().catch(console.error)