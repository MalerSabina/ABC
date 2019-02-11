const FS = require('fs');

let FILES = {};
let BLOCKS = {};

let inputFile = process.argv[2] || './input.csv';
let inputCSV = FS.readFileSync(inputFile).toString();

// console.log(inputCSV);
let lines = inputCSV.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (!line) {
        continue;
    }

    if (line.indexOf('#') == 0) {
        continue;
    }

    let fields = line.split(',');

    let recordType = fields[0];

    switch (recordType) {

        case "F": {

            /*
            Fields order
            00 - Literal 'F', meaning File
            01 - file index (id)
            02 - file name
            03 - directory name
            04 - blocks count in this file
            05 - block id,
            06 - block size
            repeat 05-06

            */

            let fileIndex = fields[1];
            let fileName = fields[2];

            let unknownField = fields[3];

            let blockCount = Number(fields[4]);

            let fileBlocks = [];
            let fileWeight = 0;

            for (let j = 0; j < blockCount; j++) {

                let pos = 5 + j * 2;
                let blockIndex = fields[pos];
                let blockWeight = Number(fields[pos + 1]);

                if (blockIndex == "169")
                {
                    a = 0;
                }

                fileBlocks.push({
                    blockIndex: blockIndex,
                    blockWeight: blockWeight,
                });

                fileWeight += blockWeight;

                if (!BLOCKS[blockIndex]) {
                    BLOCKS[blockIndex] = {
                        blockIndex: blockIndex,
                        blockWeight: blockWeight,
                        files: {},
                    }
                }

                BLOCKS[blockIndex].files[fileIndex] = true;
            }

            for (let blockKey in BLOCKS)
            {
                BLOCKS[blockKey].filesKeys = Object.keys(BLOCKS[blockKey].files);
            }

            if (FILES[fileIndex]) {
                console.log('File index', fileIndex, 'already exists');
                continue;
            }

            FILES[fileIndex] = {
                fileIndex: fileIndex,
                fileName: fileName,
                fileBlocks: fileBlocks,
                fileWeight: fileWeight,
            }

            break;
        }

        case "B": {

            break;
        }

        case "R": {

            break;
        }

        case "D": {

            break;
        }

        default: {

            console.log('Wrong record type:', recordType);

            break;
        }
    }
}

// console.log(BLOCKS[9]);
// console.log(BLOCKS[67]);
// console.log(FILES[6]);

module.exports = {
    FILES: FILES,
    BLOCKS: BLOCKS,
    BLOCK_KEYS: Object.keys(BLOCKS),
}
