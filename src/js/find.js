define([
  './core',
  './fibre-extend'
], function( Han, Fibre ) {

Han.find = Fibre

void [
  'replace',
  'wrap',
  'revert',
  'jinzify',
  'charify'
].forEach(function( method ) {
  Han.fn[ method ] = function() {
    if ( !this.finder ) {
      // Share the same selector
      this.finder = Han.find( this.context )
    }

    this.finder[ method ]( arguments[ 0 ], arguments[ 1 ] )
    return this
  }
})

return Han
})
