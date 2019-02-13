/**
 * Generates new block sequences
 * Stores already generated sequences *
 *
 * @type {{}}
 */

let generatedSequences = {};
let generatedSequencesCount = 0;

let init = function() {

	generatedSequences = {};
	generatedSequencesCount = 0;
}

/**
 *
 * Generates a random sequence of bits with defined probability of 1
 *
 * @param bitCount
 * @param fromProbability
 * @param toProbability
 * @returns {string}
 */
let getRandomBlockSequence = function (bitCount, fromProbability, toProbability) {

	let sequence = '';
	fromProbability = (fromProbability === undefined) ? 0 : fromProbability;
	toProbability = (toProbability === undefined) ? 50 : toProbability;

	let notRandomNumbers = [];

	for (let i = 0; i < 100; i++) {

		notRandomNumbers[i] = 0;

		if (i >= fromProbability && i < toProbability)
		{
			notRandomNumbers[i] = 1;
		}
	}

	// shuffle(notRandomNumbers);

	for (let j = 0; j < 5; j++)
	{
		sequence = '';

		for (let i = 0; i < bitCount; i++)
		{
			let randomBit = Math.round(Math.random() * 99);
			sequence += notRandomNumbers[randomBit];
		}

		if (generatedSequences[sequence])
		{
			continue;
		}

		generatedSequences[sequence] = true;
		generatedSequencesCount++;
		break;
	}

	return sequence;
}

/**
 * replaces a char in specified position
 *
 * @param str
 * @param pos
 * @param char
 * @returns {string}
 */
let replaceAt = function (str, pos, char) {

	return str.substr(0, pos) + char + str.substr(pos + 1);

}

/**
 * Generates a new sequence closed to given one
 *
 * @param sequence
 * @param maxBitsToChange
 * @returns {*}
 */
let getNearSequence = function(sequence, maxBitsToChange) {

	let bitsCount = sequence.length;

	for (let i = 0; i < maxBitsToChange * 2; i++) {

		let newSequence = sequence;

		let bitsToChange = 1 + Math.round(Math.random() * (maxBitsToChange - 1));

		for (let j = 0; j < bitsToChange; j++) {

			let bit = Math.round(Math.random());
			let pos = Math.floor(Math.random() * bitsCount);

			let k = 0;
			for (k = 0; k < bitsCount; k++) {

				if ( pos + k < bitsCount - 1 && newSequence[pos + k] != bit)
				{
					pos = pos + k;
					break;
				}

				if ( pos - k > -1 && newSequence[pos - k] != bit)
				{
					pos = pos - k;
					break;
				}

			}

			if (k < bitsCount)
			{
				newSequence = replaceAt(newSequence, pos, bit);
			}
		}

		if (generatedSequences[newSequence])
		{
			continue;
		}

		generatedSequences[newSequence] = true;
		generatedSequencesCount++;

		return newSequence;
	}

	return '';
}

/**
 * remaps a bit sequence to blocks array representation
 *
 * @param sequence
 * @param blockKeys
 * @returns {Array}
 */
let sequencesToBlocks = function(sequence, blockKeys) {

	if (sequence.length > blockKeys.length)
	{
		throw new Error(`Sequence length (${sequence.length}) is greater than blocks count (${blockKeys.length})`);
	}

	let blocks = [];

	for (let i = 0; i < sequence.length; i++)
	{

		if (sequence[i] == '1')
		{
			blocks.push(blockKeys[i]);
		}
	}

	return blocks;
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
let shuffle = function (a) {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (a.length));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

let getGeneratedSequencesCount = function()
{
	return generatedSequencesCount;
}

module.exports = {
	init: init,
	getRandomBlockSequence: getRandomBlockSequence,
	getNearSequence: getNearSequence,
	sequencesToBlocks: sequencesToBlocks,
	getGeneratedSequencesCount: getGeneratedSequencesCount,
}
