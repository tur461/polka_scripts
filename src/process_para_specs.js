const fs = require('fs');
const { jObj, jStr, isObj, runShellCmd } = require('./utils');

const PARA_BIN =  process.env.PARA_BIN_PATH;
const RELAY_BIN = process.env.PARA_BIN_PATH;
const PARA_SPEC_PATH = process.env.PARA_SPEC_PATH;
const RELAY_SPEC_PATH = process.env.RELAY_SPEC_PATH;

const CMD = {
    GEN_ACC: `${RELAY_BIN} key generate --network substrate`,
}

const FILE_PATH = { 
    PHRASES_CONTR: './para_phrases_contr.txt',
    PHRASES_STASH: './para_phrases_stash.txt',
    PARA_SPEC_MOD: './specs/para_spec-modified.json',
}

async function run() {
    console.log('running');
    const para = jObj(fs.readFileSync(PARA_SPEC_PATH));

    if(isObj(para)) {
        resetFiles()
        console.log('getting stash accounts');
        const bals = para.genesis.runtime.balances.balances;
        const numOfAccs = bals.length;
        const bal = bals[0][1];
        const accsStash = await getStashAccounts(numOfAccs/2);
        const accsController = await getControllerAccounts(numOfAccs/2);
        bals.length = 0;
        console.log(numOfAccs);
        // insert controller accounts
        for(let i=0; i<numOfAccs/2; ++i) {
            bals.push([accsController[i], bal]);
        }

        // insert stash accounts
        for(let i=0; i<numOfAccs/2; ++i) {
            bals.push([accsStash[i], bal]);
        }

        // collatorSelection -> invulnerables

        const invulns = para.genesis.runtime.collatorSelection.invulnerables;
        const invLen = invulns.length;
        invulns.length = 0;

        for(let i=0; i<invLen; ++i) {
            invulns.push(accsStash[i]);
        }

        // session -> keys

        const sessKeys = para.genesis.runtime.session.keys;
        const sessKeysLen = sessKeys.length;
        sessKeys.length = 0;

        for(let i=0; i<sessKeysLen; ++i) {
            sessKeys.push([
                accsStash[i],
                accsStash[i],
                {
                    aura: accsStash[i]
                }
            ]);
        }


        writeMutatedSpec(para, FILE_PATH.PARA_SPEC_MOD);
    }
}

async function getStashAccounts(howMany) {
    let accs = []
    console.log('how many:', howMany);
    for(
        let i=0, d={}; 
        i<howMany; 
        storeToFile(d.phrase, FILE_PATH.PHRASES_STASH), accs.push(d.addr), ++i
    ) d = parse(await runShellCmd(CMD.GEN_ACC))
    return accs;
}

async function getControllerAccounts(howMany) {
    let accs = []
    console.log('how many:', howMany);
    for(
        let i=0, d={}; 
        i<howMany; 
        storeToFile(d.phrase, FILE_PATH.PHRASES_CONTR), accs.push(d.addr), ++i
    ) d = parse(await runShellCmd(CMD.GEN_ACC))
    return accs;
}

function parse(op) {
    const phrase = op.match(/Secret phrase `(.*)`/)[1].trim();
    const addr = op.match(/SS58 Address: (.*)/)[1].trim();

    console.log(phrase, addr);
    return {phrase, addr};
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

run().then().catch(console.error)