const FS = require('fs');

let FILES = {};
let BLOCKS = {};

let inputCSV = FS.readFileSync('./input.csv').toString();

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
}
