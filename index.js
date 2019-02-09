/**
 * Entry point for a project
 *
 * Creates web server
 *
 */
let Promise = require('bluebird');
let Express = require('express');
let Compress = require('compression');
let BodyParser = require('body-parser');

let BeeHive = require('./beehive');

let app = Express();

app.use(BodyParser.json());
app.use(Compress());

app.listen(80, function (err) {

    if (err)
    {
        console.error(err);
        return;
    }

    console.log('Started');
    console.log('http://localhost');

});

app.use(Express.static('./html', {
    index: 'index.html',
}));

app.post('/start', function (req, res) {

    let config = req.body.config;

    BeeHive.run(config);

    res.status(200).send({
        error: 0,
        message: 'Ok'
    });

})

app.post('/cancel', function (req, res) {

    BeeHive.cancel();

    res.status(200).send({
        error: 0,
        message: 'Ok'
    });

})

app.post('/status', function (req, res) {

    console.log('Status');

    res.status(200).json({
        error: 0,
        message: 'Ok',
        status: BeeHive.status(),
    });

})