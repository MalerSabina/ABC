/**
 *
 * Implementation of ABC Algorithm and adaptation to task of finding a block solutions *
 *
 */

// use Bluebird promises library
let Promise = require('bluebird');
// Use C++ module for calculation
const Calc = require('./build/Release/calc');


// Initial definitions
// ===================
// Read and prepare input data in optimal format (using hashmaps and arrays)
let INPUT = require('./input');
// Random Blocks Sequences generator
let Sequence = require('./sequence');
// Solutions storage
let Solutions = require('./solutions');
// Thread idle time
let WAIT_DELAY = 5;

/**
 * Calculates a weight of specified blocks when trying to delete them *
 *
 * @param blocks
 * @returns {Promise<{blocks: string[], files: string[], weight: number}>}
 */
let getFileInfoForBlocks = async function (blocks) {

	let filesMap = {};
	let weight = 0;

	// Prepare which files contain these blocks
	for (let i = 0; i < blocks.length; i++)
	{
		if (WAIT_DELAY && i % 100 == 0)
		{
			await Promise.delay(WAIT_DELAY);
		}

		let blockIndex = blocks[i];
		let filesForBlock = INPUT.BLOCKS[blockIndex].filesKeys;

		for (let j = 0; j < filesForBlock.length; j++)
		{
			if (BeeHive.isCancel == true)
			{
				return;
			}

			if (WAIT_DELAY && j % 100 == 0)
			{
				await Promise.delay(WAIT_DELAY);
			}

			let fileIndex = filesForBlock[j];
			filesMap[fileIndex] = true;
		}
	}

	let files = Object.keys(filesMap);

	let blocksInFiles = {};

	for (let i = 0; i < files.length; i++)
	{
		let file = files[i];
		let fileBlocks = INPUT.FILES[file].fileBlocks;

		// console.log('fileBlocks.length =', fileBlocks.length);

		for (let j = 0; j < fileBlocks.length; j++)
		{
			if (BeeHive.isCancel == true)
			{
				return;
			}

			if (WAIT_DELAY && j % 100 == 0)
			{
				await Promise.delay(WAIT_DELAY);
			}

			let block = fileBlocks[j];

			blocksInFiles[block.blockIndex] = blocksInFiles[block.blockIndex] || {
				blockIndex: block.blockIndex,
				count: 0,
			}

			blocksInFiles[block.blockIndex].count++;
		}
	}

	let blocksToRemove = {};

	for (let blockIndex in blocksInFiles)
	{
		let block = blocksInFiles[blockIndex];

		if (block.count == INPUT.BLOCKS[blockIndex].filesKeys.length)
		{
			weight += INPUT.BLOCKS[blockIndex].blockWeight;
			blocksToRemove[blockIndex] = true;
		}
	}

	return {
		files: files,
		blocks: Object.keys(blocksToRemove),
		weight: weight,
	}

}

// Wrapper for native module to return Promise
let getFileInfoForBlocksNative = async function(blocksToDelete) {

	return Calc.getFileInfoForBlocks(blocksToDelete, INPUT);

}

/**
 * Analyze blocks weight and calculate fitness parameter for given blocks
 *
 * @param blocksToDelete - arrays of blocks
 * @param toDelete - data count in bytes to delete
 * @returns {Promise<*>}
 */
let getFitness = async function (blocksToDelete, toDelete) {

	let info = null;

	if (BeeHive.isUseNativeModule == true)
	{
		info = await Calc.getFileInfoForBlocks(blocksToDelete, INPUT);
	}
	else
	{
		info = await getFileInfoForBlocks(blocksToDelete);
	}

	if (BeeHive.isCancel == true)
	{
		return;
	}

	let memorySize = info.weight;

	let fitness;

	if (memorySize < toDelete)
	{
		fitness = 1 / (toDelete - memorySize);
	} else
	{
		fitness = 1 / (1 + (memorySize - toDelete));
	}

	info.fitness = fitness;

	return info;
}

/**
 * BeeHive - main class instance to control bees, generate block sequences and analyzing results
 * @type {{cancel: BeeHive.cancel, rangeIndex: number, ranges: Array, maxBitsToChange: number, initRandomSequences: BeeHive.initRandomSequences, run: BeeHive.run, getFreeBee: BeeHive.getFreeBee, expiredAt: number, isUseNativeModule: boolean, sendRandomBee: (function(*): Promise<* | never>), find: (function(): Promise<T | never>), weightToDelete: number, isAllBeesFree: BeeHive.isAllBeesFree, beeFailures: Array, maxFailCountForOneBee: number, init: BeeHive.init, isCancel: boolean, getSolution: (function(): (*|null)), hasResult: boolean, maxAvailableSolutionCount: number, maxIterationCount: number, beeCount: number, waitForCompletion: BeeHive.waitForCompletion, getNextRange: (function(): *), showSolution: BeeHive.showSolution, swarm: Array, maxWorkTime: number, isAllBeesFailure: BeeHive.isAllBeesFailure, isRun: boolean, isExpired: BeeHive.isExpired, sendBeeToPreciseSolution: (function(*, *=): Promise<T | never>), status: (function(): {result: *, hasResult: boolean, isRun: boolean})}}
 */

let BeeHive = {

	beeCount: 0,
	swarm: [],
	beeFailures: [],
	ranges: [],
	rangeIndex: 0,
	maxAvailableSolutionCount: 0,
	maxIterationCount: 0,
	expiredAt: 0,
	maxBitsToChange: 0,
	maxFailCountForOneBee: 0,
	weightToDelete: 0,
	maxWorkTime: 0,
	isRun: false,
	hasResult: false,
	isCancel: false,
	isUseNativeModule: false,

	/**
	 * Initializes BeeHive new object
	 *
	 * @param options Object
	 * @param options.beeCount int
	 */
	init: function (options) {

		BeeHive.beeCount = options.beeCount;
		BeeHive.swarm = Array(BeeHive.beeCount);
		BeeHive.beeFailures = Array(BeeHive.beeCount);
		BeeHive.ranges = [];
		BeeHive.rangeIndex = 0;
		BeeHive.maxAvailableSolutionCount = options.maxAvailableSolutionCount;
		BeeHive.maxIterationCount = options.maxIterationCount;
		BeeHive.maxBitsToChange = options.maxBitsToChange;
		BeeHive.maxFailCountForOneBee = options.maxFailCountForOneBee;
		BeeHive.weightToDelete = options.weightToDelete;
		BeeHive.maxWorkTime = options.maxWorkTime * 1000;
		BeeHive.expiredAt = 0;
		BeeHive.isCancel = false;
		BeeHive.hasResult = false;
		BeeHive.isUseNativeModule = options.isUseNativeModule || false;

		WAIT_DELAY = Number((BeeHive.beeCount / 50).toFixed(1));
	},

	/**
	 * Initializes how many and which ranges of sequences should be used for random bees
	 */
	initRandomSequences: function () {

		let rangeCount = 100 / BeeHive.beeCount;

		for (let i = 0; i < BeeHive.beeCount; i++)
		{
			BeeHive.ranges.push([0, parseInt(rangeCount * (i + 1))]);
		}

		BeeHive.rangeIndex = 0;
	},

	/**
	 * returns true if a calculation time is over
	 *
	 * @returns {boolean}
	 */
	isExpired: function () {

		if (BeeHive.expiredAt < new Date().getTime())
		{
			return true;
		}

		return false;
	},

	/**
	 *
	 *
	 * @returns a range of sequence in Round-robin order
	 */
	getNextRange: function () {

		let range = BeeHive.ranges[BeeHive.rangeIndex];
		BeeHive.rangeIndex++;
		BeeHive.rangeIndex = BeeHive.rangeIndex % BeeHive.ranges.length;

		return range;
	},

	/**
	 * Finds first free bee slot
	 *
	 * @returns {number} bee index
	 */
	getFreeBee: function () {

		for (let i = 0; i < BeeHive.swarm.length; i++)
		{
			if (BeeHive.swarm[i])
			{
				continue;
			}

			if (BeeHive.beeFailures[i] >= BeeHive.maxFailCountForOneBee)
			{
				continue;
			}

			return i;
		}

		return -1;
	},

	/**
	 * returns true if all bees in the hive	 *
	 *
	 * @returns {boolean}
	 */
	isAllBeesFree: function () {

		for (let i = 0; i < BeeHive.swarm.length; i++)
		{
			if (BeeHive.swarm[i])
			{
				return false;
			}
		}

		return true;

	},

	/**
	 * send a bee to explore a random sequence
	 *
	 * @param beeIndex
	 * @returns {Promise<* | never>}
	 */
	sendRandomBee: function (beeIndex) {

		let range = BeeHive.getNextRange();
		let sequence = Sequence.getRandomBlockSequence(INPUT.BLOCK_KEYS.length, range[0], range[1]);

		return Promise.resolve()
		.then(function () {

			return WAIT_DELAY && Promise.delay(WAIT_DELAY);

		})
		.then(function () {

			let blocks = Sequence.sequencesToBlocks(sequence, INPUT.BLOCK_KEYS);

			return getFitness(blocks, BeeHive.weightToDelete);

		})
		.then(function (solution) {

			if (solution)
			{
				solution.sequence = sequence;
				Solutions.addSolution(solution);
			}

		})
		.then(function () {

			console.log(`Random bee ${beeIndex} finished`);
			BeeHive.swarm[beeIndex] = null;

		})

	},

	/**
	 * send a bee to try get better result based on explored solution
	 *
	 * @param beeIndex
	 * @param solution
	 * @returns {Promise<T | never>}
	 */
	sendBeeToPreciseSolution: function (beeIndex, solution) {

		return Promise.resolve()
		.then(async function () {

			if (!solution)
			{
				a = 0;
			}

			let iterationCount = BeeHive.maxIterationCount;
			let sequence = solution.sequence;
			let fitness = solution.fitness;

			let result = null;

			while (iterationCount >= 0 && BeeHive.isCancel == false)
			{
				let newSequence = Sequence.getNearSequence(sequence, BeeHive.maxBitsToChange);

				if (!newSequence)
				{
					return result;
				}

				let blocks = Sequence.sequencesToBlocks(newSequence, INPUT.BLOCK_KEYS);

				let info = await getFitness(blocks, BeeHive.weightToDelete);

				// await Promise.delay(WAIT_DELAY);

				if (info && info.fitness > fitness)
				{
					info.sequence = newSequence;
					iterationCount = BeeHive.maxIterationCount;
					result = info;
					sequence = newSequence;
					fitness = info.fitness;
				} else
				{
					iterationCount--;
				}
			}

			return result;
		})
		.then(function (result) {

			if (result)
			{
				BeeHive.beeFailures[beeIndex] = 0;

				Solutions.addSolution(result);
			} else
			{
				BeeHive.beeFailures[beeIndex]++;
			}

		})
		.then(function () {

			console.log(`Precision bee ${beeIndex} finished`);

			BeeHive.swarm[beeIndex] = null;

		})
	},

	/**
	 * returns true when all bees are explored their solutions for 100%
	 *
	 * @returns {boolean}
	 */
	isAllBeesFailure: function () {

		for (let i = 0; i < BeeHive.beeFailures.length; i++)
		{
			if (BeeHive.beeFailures[i] < BeeHive.maxFailCountForOneBee)
			{
				return false;
			}
		}

		return true;
	},

	/**
	 * Pauses an execution until all calculation finished
	 *
	 * @returns {Promise<void>}
	 */
	waitForCompletion: async function () {

		while (true)
		{
			await Promise.delay(10);

			console.log('Waiting for completion');

			if (BeeHive.isAllBeesFree() == true)
			{
				break;
			}
		}

	},

	/**
	 * runs a calculation process
	 *
	 * @returns {Promise<T | never>}
	 */
	find: function () {

		return Promise.resolve()
		.then(async function () {

			Sequence.init();
			Solutions.init(BeeHive.maxAvailableSolutionCount, BeeHive.weightToDelete);

			for (let i = 0; i < BeeHive.beeCount; i++)
			{
				BeeHive.beeFailures[i] = 0;
			}

			BeeHive.expiredAt = new Date().getTime() + BeeHive.maxWorkTime;

			BeeHive.initRandomSequences();

			let isSolutionFound = false;
			let ERROR = '';

			while (isSolutionFound == false)
			{
				await Promise.delay(10);

				if (BeeHive.isCancel == true)
				{
					ERROR = 'CANCELLED';
					await BeeHive.waitForCompletion();
					break;
				}

				if (BeeHive.isExpired() == true)
				{
					BeeHive.cancel();
					await BeeHive.waitForCompletion();
					ERROR = 'TIMEOUT';
					break;
				}

				// TODO: Add completion check
				// 2. Calc failure count and exit as well

				let freeBeeIndex = BeeHive.getFreeBee();

				if (freeBeeIndex == -1)
				{
					if (BeeHive.isAllBeesFailure() == true)
					{
						ERROR = 'ALL BEES OVER ITERATION LIMIT';
						break;
					}

					continue;
				}

				let availableSolutions = Solutions.getSolutions();
				BeeHive.swarm[freeBeeIndex] = 1; // Mark as busy

				if (availableSolutions.length < BeeHive.maxAvailableSolutionCount)
				{
					console.log('Send a random bee, index =', freeBeeIndex);
					BeeHive.swarm[freeBeeIndex] = BeeHive.sendRandomBee(freeBeeIndex);
				}
				else
				{
					let solution = Solutions.getSolutionToPrecise();

					console.log('Send a bee to precise, index =', freeBeeIndex);
					BeeHive.swarm[freeBeeIndex] = BeeHive.sendBeeToPreciseSolution(freeBeeIndex, solution);
				}

			}

			if (ERROR)
			{
				console.log(ERROR);
			}

			BeeHive.hasResult = true;
		})
	},

	/**
	 * Prints solution in console
	 */
	showSolution: function () {

		let solutions = Solutions.getResult();

		if (!solutions)
		{
			console.log('No solution was found');
			return;
		}

		console.log({
			fitness: solutions.fitness,
			weight: solutions.weight,
			sequence: solutions.sequence,
			files: solutions.files.join(','),
			blocks: solutions.blocks.join(','),
		});
	},

	/**
	 * returns a found solution
	 * @returns {*|null}
	 */
	getSolution: function () {

		return Solutions.getResult();

	},

	/**
	 * Sets flag to return all bees to the hive
	 */
	cancel: function () {

		BeeHive.isCancel = true;

	},

	/**
	 * returns current result
	 *
	 * @returns {{result: *, hasResult: boolean, isRun: boolean}}
	 */
	status: function () {

		let response = {
			isRun: BeeHive.isRun,
			hasResult: BeeHive.hasResult,
			result: BeeHive.getSolution(),
		}

		return response;

	},

	/**
	 * Initializes a new data and starts to find a solution
	 * @param config
	 */
	run: function (config) {

		if (BeeHive.isRun == true)
		{
			// Don't let to run simultaneously
			return;
		}

		console.log('Running...');

		BeeHive.isRun = true;
		BeeHive.hasResult = false;

		let currentTime = new Date().getTime();

		// EXAMPLE
		// config = {
		//     weightToDelete: 2000,
		//     beeCount: 30,
		//     maxIterationCount: 30,
		//     maxFailCountForOneBee: 5,
		//     maxBitsToChange: 3,
		//     maxAvailableSolutionCount: 3,
		//     maxWorkTime: 25,
		// }

		BeeHive.init(config);

		BeeHive.find()
		.then(function () {

			BeeHive.showSolution();

			console.log('Run time:', (new Date().getTime() - currentTime) / 1000, 'secs');

		})
		.catch(function (err) {

			console.error(err);

		})
		.finally(function () {

			BeeHive.isRun = false;

		})

	}

}

// Public methods
module.exports = {
	run: BeeHive.run,
	cancel: BeeHive.cancel,
	status: BeeHive.status,
}

var measureMe = async function(runner) {

	let cTime = new Date().getTime();

	return runner()
	.then(function (res) {

		console.log('Elapsed:', (new Date().getTime() - cTime));

		console.log(res);

	})
	.catch(function (err) {
		console.error(err);
	})

};

// console.log(Calc.getFileInfoForBlocks([64, 76], INPUT));
// console.log(await getFileInfoForBlocks([64, 76]));

// (async function()
// {
// 	WAIT_DELAY = 0;
//
// 	try
// 	{
// 		await measureMe(function () {
// 			return Calc.getFileInfoForBlocks([64, 76, 25, 24, 38, 49], INPUT);
// 			// return getFileInfoForBlocksNative([64, 76, 25, 24, 38, 49]);
// 		})
//
// 		await measureMe(function () {
// 			return getFileInfoForBlocks([64, 76, 25, 24, 38, 49]);
// 		})
// 	}
// 	catch (e)
// 	{
// 		console.error(e);
// 	}
// }());

return Promise.resolve()
.then(function () {

	return Calc.getFileInfoForBlocks([64, 76, 25, 24, 38, 49], INPUT);

})
.then(function (res) {

	console.log('1111', res);

})
.catch(function (err) {

	console.error('2222', err);

})

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