
var client = require('pelias-esclient')(),
    schema = require('../schema');

var _index = 'pelias';

// Error: ElasticsearchIllegalArgumentException[can't change the number of shards for an index
if( schema.settings.hasOwnProperty('index') &&
    schema.settings.index.hasOwnProperty('number_of_shards') ){
  delete schema.settings.index.number_of_shards;
}

client.indices.close( { index: _index }, function( err, res ){
  console.log( '[close index]', '\t', _index, err || '\t', res );
  client.indices.putSettings( { index: _index, body: schema.settings }, function( err, res ){
    console.log( '[put settings]', '\t', _index, err || '\t', res );
    client.indices.open( { index: _index }, function( err, res ){
      console.log( '[open index]', '\t', _index, err || '\t', res );
      process.exit( !!err );
    });
  });
});
