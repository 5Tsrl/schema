
// validate analyzer is behaving as expected

var tape = require('tape'),
    elastictest = require('elastictest'),
    schema = require('../schema'),
    punctuation = require('../punctuation');

module.exports.tests = {};

module.exports.tests.analyze = function(test, common){
  test( 'analyze', function(t){

    var suite = new elastictest.Suite( null, { schema: schema } );
    var assertAnalysis = analyze.bind( null, suite, t, 'peliasTwoEdgeGram' );
    suite.action( function( done ){ setTimeout( done, 500 ); }); // wait for es to bring some shards up

    assertAnalysis( 'lowercase', 'FA', ['fa']);
    assertAnalysis( 'asciifolding', 'éA', ['ea']);
    assertAnalysis( 'asciifolding', 'ß', ['ss']);
    assertAnalysis( 'asciifolding', 'æ', ['ae']);
    assertAnalysis( 'asciifolding', 'łA', ['la']);
    assertAnalysis( 'asciifolding', 'ɰA', ['ma']);
    assertAnalysis( 'trim', ' fA ', ['fa'] );
    assertAnalysis( 'stop_words', 'aa street bb avenue cc', ['aa','bb','cc'] );
    assertAnalysis( 'ampersand', 'aa and bb', ['aa','bb'] );

    // note, this functionality could be changed in the future in
    // order to allow the following cases to pass:
    // assertAnalysis( 'ampersand', 'aa and bb', ['aa','&','bb'] );
    // assertAnalysis( 'ampersand', 'aa & bb', ['aa','&','bb'] );
    // assertAnalysis( 'ampersand', 'aa and & and bb', ['aa','&','bb'] );

    assertAnalysis( 'peliasTwoEdgeGramFilter', '1 a ab abc abcdefghijk', ['ab','abc','abcd','abcde','abcdef','abcdefg','abcdefgh','abcdefghi','abcdefghij'] );
    assertAnalysis( 'removeAllZeroNumericPrefix', '0002 00011', ['11'] );
    assertAnalysis( 'unique', '11 11 11', ['11'] );
    assertAnalysis( 'notnull', 'avenue street', [] );

    assertAnalysis( 'kstem', 'mcdonalds', ['mc', 'mcd', 'mcdo', 'mcdon', 'mcdona', 'mcdonal', 'mcdonald'] );
    assertAnalysis( 'kstem', 'McDonald\'s', ['mc', 'mcd', 'mcdo', 'mcdon', 'mcdona', 'mcdonal', 'mcdonald'] );
    assertAnalysis( 'kstem', 'peoples', ['pe', 'peo', 'peop', 'peopl', 'people'] );

    // remove punctuation (handled by the char_filter)
    assertAnalysis( 'punctuation', punctuation.all.join(''), ['-&'] );

    // ensure that single grams are not created
    assertAnalysis( '1grams', 'a aa b bb 1 11', ['aa','bb','11'] );

    suite.run( t.end );
  });
};

module.exports.tests.functional = function(test, common){
  test( 'functional', function(t){

    var suite = new elastictest.Suite( null, { schema: schema } );
    var assertAnalysis = analyze.bind( null, suite, t, 'peliasTwoEdgeGram' );
    suite.action( function( done ){ setTimeout( done, 500 ); }); // wait for es to bring some shards up

    assertAnalysis( 'country', 'Trinidad and Tobago', [
      'tr', 'tri', 'trin', 'trini', 'trinid', 'trinida', 'trinidad', 'to', 'tob', 'toba', 'tobag', 'tobago'
    ]);

    assertAnalysis( 'place', 'Toys "R" Us!', [
      'to', 'toy', 'us'
    ]);

    assertAnalysis( 'address', '101 mapzen place', [
      '10', '101', 'ma', 'map', 'mapz', 'mapze', 'mapzen'
    ]);

    suite.run( t.end );
  });
};

module.exports.all = function (tape, common) {

  function test(name, testFunction) {
    return tape('peliasTwoEdgeGram: ' + name, testFunction);
  }

  for( var testCase in module.exports.tests ){
    module.exports.tests[testCase](test, common);
  }
};

function analyze( suite, t, analyzer, comment, text, expected ){
  suite.assert( function( done ){
    suite.client.indices.analyze({
      index: suite.props.index,
      analyzer: analyzer,
      text: text
    }, function( err, res ){
      if( err ) console.error( err );
      t.deepEqual( simpleTokens( res.tokens ), expected, comment );
      done();
    });
  });
}

function simpleTokens( tokens ){
  return tokens.map( function( t ){
    return t.token;
  });
}