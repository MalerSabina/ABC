var OS = require('os');
var CSVFromJSON = require('csvfromjson');
var Promise = require('bluebird');
var Fs = require('fs');

let FILE_COUNT = 1000;
let BLOCKS_COUNT = 1000;
let BLOCK_SIZE = [1, 65535];
let FILES_PER_BLOCK = [1, FILE_COUNT >> 1];
let OUTPUT_FILE = __dirname + `/input-${FILE_COUNT}-${BLOCKS_COUNT}.csv`;


let getUniqueRandomSequence = function (from, to, count, probabilities)
{
	let TAG = 'getUniqueRandomSequence:';
	let map = {};

	if (count > to - from)
	{
		throw new Exception(TAG, `Invalid paramers: count (${count}) must be greater than to (${to}) - from (${from}) (${to - from})`);
	}

	for (let i = 0; i < count; i++)
	{
		let val = from + Math.floor(Math.random() * (to - from));

		if (map[val])
		{
			i--;
			continue;
		}

		map[val] = val;
	}

	return Object.values(map);
}

Promise.resolve()
.then(function () {

	let FILES = new Array(FILE_COUNT);

	for (let i = 0; i < FILE_COUNT; i++)
	{
		FILES[i] = [];
	}

	for (let i = 0; i < BLOCKS_COUNT; i++)
	{
		let blockSize = BLOCK_SIZE[0] + Math.floor(Math.random() * (BLOCK_SIZE[1] - BLOCK_SIZE[0]));
		let filesCount = Math.floor(Math.random() * (FILE_COUNT >> 1));

		if (filesCount == 0)
		{
			a = 0;
		}

		let filesSequence = getUniqueRandomSequence(0, FILE_COUNT, filesCount);

		for (let j = 0; j < filesSequence.length; j++)
		{
			let fileIndex = filesSequence[j];

			FILES[fileIndex].push({
				blockIndex: i,
				blockSize: blockSize,
			});
		}

	}

	let output = [];

	for (let i = 0; i < FILES.length; i++)
	{
		let file = FILES[i];

		let csvArr = [
			'F',
			i,
			'file_name',
			'dir_name',
			file.length,
		];

		for (let j = 0; j < file.length; j++)
		{
			let block = file[j];
			csvArr.push(block.blockIndex);
			csvArr.push(block.blockSize);
		}

		output.push(csvArr.join(','));
	}

	console.log(output.join('\n'));

	Fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
})
.catch(function (err) {

	console.error(err);

});
