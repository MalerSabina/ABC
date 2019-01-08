let Promise = require('bluebird');

let Config = {
    weightToDelete: 2000,
    workingBeesCount: 5,
    maxIterationCount: 30,
    maxFailCountForOneBee: 5,
    maxBitsToChange: 3,
    bestSolutionsCount: 3,
    maxWorkTime: 1000 * 10,
}


let INPUT = require('./input');
let Sequence = require('./sequence');
let Solutions = require('./solutions');

Solutions.init(Config.bestSolutionsCount, Config.weightToDelete);

let getFileInfoForBlocks = function(blocks) {

    let filesMap = {};
    let weight = 0;

    for (let i = 0; i < blocks.length; i++) {
        let blockIndex = blocks[i];

        if (!INPUT.BLOCKS[blockIndex])
        {
            a = 0;
        }

        let filesForBlock = Object.keys(INPUT.BLOCKS[blockIndex].files);

        for (let j = 0; j < filesForBlock.length; j++) {
            let fileIndex = filesForBlock[j];
            filesMap[fileIndex] = true;
        }
    }

    let files = Object.keys(filesMap);

    let blocksInFiles = {};

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        let fileBlocks = INPUT.FILES[file].fileBlocks;

        for (let j = 0; j < fileBlocks.length; j++)
        {
            let block = fileBlocks[j];

            blocksInFiles[block.blockIndex] = blocksInFiles[block.blockIndex] || {
                blockIndex: block.blockIndex,
                count: 0,
            }

            blocksInFiles[block.blockIndex].count++;
        }
    }

    for (let blockIndex in blocksInFiles) {

        let block = blocksInFiles[blockIndex];

        if (block.count == Object.keys(INPUT.BLOCKS[blockIndex].files).length)
        {
            weight += INPUT.BLOCKS[blockIndex].blockWeight;
        }
    }

    return {
        files: files,
        blocks: Object.keys(blocksInFiles),
        weight: weight,
    }

}

let getFitness = function (blocksToDelete, toDelete) {

    let info = getFileInfoForBlocks(blocksToDelete);

    let memorySize = info.weight;

    let fitness;

    if (memorySize < toDelete)
    {
        fitness = 1/(toDelete - memorySize);
    }
    else
    {
        fitness = 1/(1 + (memorySize - toDelete));
    }

    info.fitness = fitness;

    return info;
}


// let getBetterFitness = async function(params) {
//
//     return Promise.resolve()
//         .then(async function () {
//
//             let iterationCount = params.maxIterationCount;
//             let sequence = params.sequence;
//
//             if (!sequence)
//             {
//                 let range = BeeHive.getNextRange();
//                 sequence = Sequence.getRandomBlockSequence(Object.keys(INPUT.BLOCKS).length, range[0], range[1]);
//             }
//
//             let fitness = params.fitness || 0;
//             let result = null;
//
//             while (iterationCount >= 0)
//             {
//                 let newSequence = Sequence.getNearSequence(sequence, params.maxBitsToChange);
//
//                 if (!newSequence)
//                 {
//                     return result;
//                 }
//
//                 let blocks = Sequence.sequencesToBlocks(newSequence);
//
//                 let info = getFitness(blocks, Config.weightToDelete);
//                 // await Promise.delay(0);
//
//                 info.sequence = newSequence;
//
//                 if (info.fitness > fitness)
//                 {
//                     iterationCount = params.maxIterationCount;
//                     result = info;
//                     sequence = newSequence;
//                     fitness = info.fitness;
//                 }
//                 else
//                 {
//                     iterationCount--;
//                 }
//             }
//
//             return result;
//         })
//
// }

// console.log('Files to delete:', getFitness([0, 1], Config.weightToDelete));
// console.log('Sequence:', Sequence.getRandomBlockSequence(Object.keys(INPUT.BLOCKS).length));

// let findTheBestRandomSolution = async function () {
//
//     return Promise.resolve()
//         .then(async function () {
//
//             let bestSolutions = [];
//
//             let expiredAt = new Date().getTime() + Config.maxWorkTime;
//
//             let ranges = [];
//
//             let rangeCount = parseInt(100 / Config.workingBeesCount);
//
//             for (let i = 0; i < Config.workingBeesCount; i++) {
//
//                 ranges.push([0, rangeCount * (i + 1)]);
//
//             }
//
//             // let ranges = [
//             //     [0, 10],
//             //     [0, 50],
//             //     [0, 90]
//             // ];
//
//             let rangesArray = [];
//
//             for (let i = 0; i < ranges.length; i++) {
//                 rangesArray.push(i);
//             }
//
//             while (true)
//             {
//                 if (expiredAt < new Date().getTime())
//                 {
//                     break;
//                 }
//
//                 let isContinue = await Promise.resolve()
//                     .then(function () {
//
//                         return Promise.map(rangesArray, async function (rangeIndex) {
//
//                             let range = ranges[rangeIndex];
//
//                             let sequence = Sequence.getRandomBlockSequence(Object.keys(INPUT.BLOCKS).length, range[0], range[1]);
//
//                             if (!sequence)
//                             {
//                                 return {
//                                     isContinue: false
//                                 }
//                             }
//
//                             let blocks = Sequence.sequencesToBlocks(sequence);
//
//                             // console.log(blocks.join(','));
//
//                             let info = getFitness(blocks, Config.weightToDelete);
//
//                             await Promise.delay(0);
//
//                             let betterInfo = (await getBetterFitness({
//                                 sequence: sequence,
//                                 fitness: info.fitness,
//                                 weightToDelete: Config.weightToDelete,
//                                 maxIterationCount: Config.maxIterationCount,
//                                 maxBitsToChange: Config.maxBitsToChange
//                             }));
//
//                             if (!betterInfo)
//                             {
//                                 betterInfo = info;
//                             }
//
//                             let solution = {
//                                 fitness: betterInfo.fitness,
//                                 blocks: betterInfo.blocks.join(','),
//                                 sequence: betterInfo.sequence,
//                                 weight: betterInfo.weight,
//                                 files: betterInfo.files.join(','),
//                             }
//
//                             Solutions.addSolution(solution);
//
//                             return {
//                                 isContinue: true
//                             }
//                         })
//
//                     })
//                     .then(function (r) {
//
//                         let isContinue = false;
//
//                         for (let i = 0; i < r.length; i++)
//                         {
//                             let result = r[i];
//
//                             if (result.isContinue == true)
//                             {
//                                 isContinue = true;
//                                 break;
//                             }
//                         }
//
//                         if (isContinue == false)
//                         {
//                             throw new Error('Early loop ending');
//                         }
//
//                         return true;
//                     })
//                     .catch(function (err) {
//
//                         console.error(err);
//
//                         return Promise.resolve(false);
//                     })
//
//                 if (isContinue == false)
//                 {
//                     break;
//                 }
//
//                 break;
//
//             }
//
//         })
// }

let BeeHive = {

    beeCount: Config.workingBeesCount,
    swarm: Array(Config.workingBeesCount),
    ranges: [],
    rangeIndex: 0,
    maxAvailableSolutionCount: Config.bestSolutionsCount,
    maxIterationCount: Config.maxIterationCount,
    expiredAt: 0,
    maxBitsToChange: Config.maxBitsToChange,

    initRandomSequences: function() {

        let rangeCount = parseInt(100 / BeeHive.beeCount);

        for (let i = 0; i < BeeHive.beeCount; i++)
        {
            BeeHive.ranges.push([0, rangeCount * (i + 1)]);
        }

        BeeHive.rangeIndex = 0;
    },

    isExpired: function() {

        if (BeeHive.expiredAt < new Date().getTime())
        {
            return true;
        }

        return false;
    },

    getNextRange: function() {

        let range = BeeHive.ranges[BeeHive.rangeIndex];
        BeeHive.rangeIndex++;
        BeeHive.rangeIndex = BeeHive.rangeIndex % BeeHive.ranges.length;

        return range;
    },

    getFreeBee: function() {

        for (let i = 0; i < BeeHive.swarm.length; i++)
        {
            if (BeeHive.swarm[i])
            {
                continue;
            }

            return i;
        }

        return -1;
    },

    sendRandomBee: function() {

        let range = BeeHive.getNextRange();
        let sequence = Sequence.getRandomBlockSequence(Object.keys(INPUT.BLOCKS).length, range[0], range[1]);

        return Promise.resolve()
            .then(function () {

                let blocks = Sequence.sequencesToBlocks(sequence);

                // console.log(blocks.join(','));

                let solution = getFitness(blocks, Config.weightToDelete);
                solution.sequence = sequence;

                return solution;
            })
            .then(function (result) {

                Solutions.addSolution(result);

            })

    },

    sendBeeToPreciseSolution: function (solution) {

        return Promise.resolve()
            .then(async function () {

                let iterationCount = BeeHive.maxIterationCount;
                let sequence = solution.sequence;
                let fitness = solution.fitness;

                let result = null;

                while (iterationCount >= 0)
                {
                    let newSequence = Sequence.getNearSequence(sequence, BeeHive.maxBitsToChange);

                    if (!newSequence)
                    {
                        return result;
                    }

                    let blocks = Sequence.sequencesToBlocks(newSequence);

                    let info = getFitness(blocks, Config.weightToDelete);

                    info.sequence = newSequence;

                    await Promise.delay(0);

                    if (info.fitness > fitness)
                    {
                        iterationCount = BeeHive.maxIterationCount;
                        result = info;
                        sequence = newSequence;
                        fitness = info.fitness;
                    }
                    else
                    {
                        iterationCount--;
                    }
                }

                return result;
            })
            .then(function (result) {

                Solutions.addSolution(result);

            })
    },

    find: async function () {

        BeeHive.expiredAt = new Date().getTime() + Config.maxWorkTime;

        BeeHive.initRandomSequences();

        let isSolutionFound = false;
        let ERROR = '';

        while (isSolutionFound == false)
        {
            if (BeeHive.isExpired() == true)
            {
                ERROR = 'TIMEOUT';
                break;
            }

            await Promise.delay(0);

            // TODO: Add completion check
            // 2. Calc failure count and exit as well

            let freeBeeIndex = BeeHive.getFreeBee();

            if (freeBeeIndex == -1)
            {
                continue;
            }

            let availableSolutions = Solutions.getSolutions();

            if (availableSolutions.length < BeeHive.maxAvailableSolutionCount)
            {
                BeeHive.swarm[freeBeeIndex] = BeeHive.sendRandomBee();
            }
            else
            {
                let solution = Solutions.getSolutionToPrecise();

                BeeHive.swarm[freeBeeIndex] = BeeHive.sendBeeToPreciseSolution(solution);
            }

        }

        if (ERROR)
        {
            console.log(ERROR);
        }

        BeeHive.showSolution();

    },

    showSolution: function () {

        let solutions = Solutions.getResult();

        console.log({
            fitness: solutions.fitness,
            weight: solutions.weight,
            sequence: solutions.sequence,
            files: solutions.files.join(','),
            blocks: solutions.blocks.join(','),
        });
    }

}

BeeHive.find();


// findTheBestRandomSolution();

// let test = {
//     fitness: 0.0000017356410416623275,
//     blocks: '5,7,17,21,22,27,28,33,43,54,57',
//     weight: 578155
// }
//
// let info = getFitness([64, 76], Config.weightToDelete);
//
// console.log(info);

// let info = getFitness([4], Config.weightToDelete);
// console.log(info);

// Solutions.getSolutionToPrecise();