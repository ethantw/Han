define([
  './core',
  './farr/farr'
], function( Han, Farr ) {

Han.find = Farr

;[ 'replace', 'wrap', 'revert', 'jinzify', 'charify' ]
.forEach(function( method ) {
  Han.fn[ method ] = function() {
    if ( !this.finder ) {
      // Share the same selector
      this.finder = Han.find( this.context )
    }
    Han.find[ method ].apply( this, arguments )
    return this
  }
})

return Han
})
