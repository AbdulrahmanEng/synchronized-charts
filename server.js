const express = require('express');
const path = require('path');
const app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('dist'));

app.use(express.static('public'));

const Datastore = require('nedb');
const db = new Datastore({ filename: 'data/quotes.db', autoload: true });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/quotes', (req, res) => {
    db.find({}, (err, docs) => {
        if (err) {
            throw err;
        }
        else {
            res.json({ data: docs });
        }
    });
});

app.delete('/quotes/:quote', (req, res) => {
    const quote = req.params.quote;
    if(quote){
        db.remove({ symbol: quote }, {}, function (err, numRemoved) {
        if(err){
            throw err;
        }
        if(numRemoved){
            console.log('Quote removed',quote);
        }
    });
}
});

io.on('connection', (socket) => {

    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });

    socket.on('quote symbol', (symbol) => {

        // If the symbol is not already in the database, save it.
        db.find({ symbol: symbol }, (err, docs) => {
            if (err) {
                throw err;
            }
            else {
                if (docs.length > 0) {
                    // Check for duplicates.
                    docs.forEach(doc => {
                        if (doc.symbol === symbol) {
                            return;
                        }
                        else {
                            db.insert({ symbol: symbol }, (err, newDoc) => {
                                if (err) {
                                    throw err;
                                }
                                io.emit('quote symbol', symbol);
                            });
                        }
                    })
                }
                else {
                    db.insert({ symbol: symbol }, (err, newDoc) => {
                        if (err) {
                            throw err;
                        }
                        console.log('Saved', symbol)
                        io.emit('quote symbol', symbol);
                    });
                }
            }
        });
    });
});

const port = process.env.PORT || 8080;
http.listen(port, () => console.log(`Listening https://${process.env.IP || 'localhost'}:${port}`));