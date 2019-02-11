/**
 * Stores solutions
 *
 *
 * @type {number}
 */

let MAX_POOL_SIZE = 3;
let TO_DELETE = 0;

let solutionsPool = [];
let result = null;


module.exports = {

	/**
	 * Initializes a new solution pool
	 *
	 * @param maxPoolCount
	 * @param toDelete
	 */
	init: function(maxPoolCount, toDelete) {

		solutionsPool = [];
		result = null;
		MAX_POOL_SIZE = maxPoolCount;
		TO_DELETE = toDelete;

	},

	/**
	 * Adds solution to the pool	 *
	 *
	 * @param solution
	 */
	addSolution: function (solution) {

		for (let i = 0; i < solutionsPool.length; i++)
		{
			let existingSolution = solutionsPool[i];

			if (solution.fitness > existingSolution.fitness)
			{
				isSolutionBetter = true;
				break;
			}
		}

		if (solution.weight >= TO_DELETE)
		{
			result = result || solution;

			if (solution.weight < result.weight)
			{
				result = solution;
			}
		}

		solutionsPool.push(solution);
		solutionsPool = solutionsPool.sort(function (a, b) {
			return b.fitness - a.fitness;
		});
		solutionsPool = solutionsPool.slice(0, MAX_POOL_SIZE);
	},

	/**
	 * returns a solution which can be represented as a result
	 *
	 * @returns {*}
	 */
	getResult: function () {

		return result;

	},

	/**
	 * Get solutions pool
	 *
	 * @returns {Array}
	 */
	getSolutions: function () {

		return solutionsPool;

	},

	/**
	 * Finds a solution to make it better
	 *
	 * @returns {*}
	 */
	getSolutionToPrecise: function () {

		let length = solutionsPool.length;
		let itemLength = length;
		let allLength = length;
		let ranges = [];

		for (let i = 0; i < length; i++)
		{
			if (itemLength % 2 == 0)
			{
				itemLength = itemLength >> 1;
				ranges.push(itemLength);
				continue;
			}

			allLength = allLength << 1;
			itemLength = itemLength << 1;
			for (let j = 0; j < ranges.length; j++)
			{
				ranges[j] = ranges[j] << 1;
			}

			i--;
		}

		ranges[length - 1] = ranges[length - 2];
		// console.log('ranges:', ranges, ', length:', allLength);

		let notRandomNumbers = Array(allLength);

		for (let i = 0; i < allLength; i++)
		{
			let range = 0;

			for (let j = 0; j < ranges.length; j++)
			{
				range += ranges[j];
				if (i < range)
				{
					notRandomNumbers[i] = j;
					break;
				}
			}
		}

		// console.log(notRandomNumbers.join(','))

		let index = Math.round(Math.random() * (allLength - 1));

		// console.log(notRandomNumbers[index])

		let solutionIndex = notRandomNumbers[index];

		if (!solutionsPool[solutionIndex])
		{
			a = 0
		}

		return solutionsPool[solutionIndex];
	}

}