let generatedSequences = {};

let init = function() {

	generatedSequences = {};

}

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
		break;
	}

	return sequence;
}

let replaceAt = function (str, pos, char) {

	return str.substr(0, pos) + char + str.substr(pos + 1);

}

let getNearSequence = function(sequence, maxBitsToChange) {

	let bitsCount = sequence.length;

	for (let i = 0; i < maxBitsToChange * 2; i++) {

		let newSequence = sequence;

		let bitsToChange = 1 + Math.round(Math.random() * (maxBitsToChange - 1));

		for (let j = 0; j < bitsToChange; j++) {

			let bit = Math.round(Math.random());
			let pos = Math.floor(Math.random() * bitsCount);

			let k = 0;
			for (k = 0; k < maxBitsToChange * 2; k++) {

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

		return newSequence;
	}

	return '';
}

let sequencesToBlocks = function(sequence, blockKeys) {

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

module.exports = {
	init: init,
	getRandomBlockSequence: getRandomBlockSequence,
	getNearSequence: getNearSequence,
	sequencesToBlocks: sequencesToBlocks,
}
