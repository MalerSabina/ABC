let Promise = require('bluebird');
const Calc = require('./build/Release/calc');

let INPUT = require('./input');
let Sequence = require('./sequence');
let Solutions = require('./solutions');
let BLOCK_KEYS = Object.keys(INPUT.BLOCKS);

let getFileInfoForBlocks = function (blocks) {

	let filesMap = {};
	let weight = 0;

	for (let i = 0; i < blocks.length; i++)
	{
		let blockIndex = blocks[i];

		if (!INPUT.BLOCKS[blockIndex])
		{
			a = 0;
		}

		let filesForBlock = Object.keys(INPUT.BLOCKS[blockIndex].files);

		for (let j = 0; j < filesForBlock.length; j++)
		{
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

	for (let blockIndex in blocksInFiles)
	{

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

	let info = null;

	if (BeeHive.isUseNativeModule == true)
	{
		info = Calc.getFileInfoForBlocks(blocksToDelete, INPUT);
	}
	else
	{
		info = getFileInfoForBlocks(blocksToDelete, INPUT);
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
	},

	initRandomSequences: function () {

		let rangeCount = 100 / BeeHive.beeCount;

		for (let i = 0; i < BeeHive.beeCount; i++)
		{
			BeeHive.ranges.push([0, parseInt(rangeCount * (i + 1))]);
		}

		BeeHive.rangeIndex = 0;
	},

	isExpired: function () {

		if (BeeHive.expiredAt < new Date().getTime())
		{
			return true;
		}

		return false;
	},

	getNextRange: function () {

		let range = BeeHive.ranges[BeeHive.rangeIndex];
		BeeHive.rangeIndex++;
		BeeHive.rangeIndex = BeeHive.rangeIndex % BeeHive.ranges.length;

		return range;
	},

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

	sendRandomBee: function (beeIndex) {

		let range = BeeHive.getNextRange();
		let sequence = Sequence.getRandomBlockSequence(BLOCK_KEYS.length, range[0], range[1]);

		return Promise.resolve()
		.then(function () {

			let blocks = Sequence.sequencesToBlocks(sequence, BLOCK_KEYS);

			// console.log(blocks.join(','));

			let solution = getFitness(blocks, BeeHive.weightToDelete);
			solution.sequence = sequence;

			return solution;
		})
		.then(function (result) {

			if (result)
			{
				Solutions.addSolution(result);
			}

		})
		.then(function () {

			BeeHive.swarm[beeIndex] = null;

		})


	},

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
			await Promise.delay(10);

			while (iterationCount >= 0 && BeeHive.isCancel == false)
			{
				let newSequence = Sequence.getNearSequence(sequence, BeeHive.maxBitsToChange);

				if (!newSequence)
				{
					return result;
				}

				let blocks = Sequence.sequencesToBlocks(newSequence, BLOCK_KEYS);

				let info = getFitness(blocks, BeeHive.weightToDelete);

				info.sequence = newSequence;

				await Promise.delay(10);

				if (info.fitness > fitness)
				{
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

			BeeHive.swarm[beeIndex] = null;

		})
	},

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

	waitForCompletion: async function () {

		while (true)
		{
			await Promise.delay(10);

			if (BeeHive.isAllBeesFree() == true)
			{
				break;
			}
		}

	},

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

				if (availableSolutions.length < BeeHive.maxAvailableSolutionCount)
				{
					BeeHive.swarm[freeBeeIndex] = BeeHive.sendRandomBee(freeBeeIndex);
				} else
				{
					let solution = Solutions.getSolutionToPrecise();

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

	getSolution: function () {

		return Solutions.getResult();

	},

	cancel: function () {

		BeeHive.isCancel = true;

	},

	status: function () {

		let response = {
			isRun: BeeHive.isRun,
			hasResult: BeeHive.hasResult,
			result: BeeHive.getSolution(),
		}

		return response;

	},

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


module.exports = {
	run: BeeHive.run,
	cancel: BeeHive.cancel,
	status: BeeHive.status,
}


// console.log(Calc.getFileInfoForBlocks([64, 76], INPUT));

// console.log(getFileInfoForBlocks([64, 76], INPUT));

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