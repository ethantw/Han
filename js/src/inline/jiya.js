define([
  '../core',
  '../method',
  '../regex'
],
function( Han, $ ) {

var
  bdgroup = $.create( 'char_group', 'biaodian cjk' )
;

Han.renderJiya = function( context ) {
  var
    context = context || document,
    finder = [ Han.find( context ) ]
  ;

  finder[ 0 ].filteredElemList += ' textarea code kbd samp pre jinze em'

  finder[ 0 ]
  .wrap( Han.TYPESET.jiya[ 0 ], $.clone( bdgroup ))
  .wrap( Han.TYPESET.jiya[ 1 ], $.clone( bdgroup ))

  $
  .qsa( 'char_group.biaodian', context )
  .forEach( function( elem ) {
    finder.push( Han( elem )
    .charify({
      hanzi:     'biaodian',
      liga:      'liga',
      word:      'none',
      latin:     'none',
      ellinika:  'none',
      kirillica: 'none'
    }))
  })

  return finder
}

$.extend( Han.fn, {
  jiya: null,

  renderJiya: function() {
    this.jiya = Han.renderJiya( this.context )
    return this
  },

  revertJiya: function() {
    try {
      for ( var i = this.jiya.length-1; i >= 0; i-- ) {
        this.jiya[ i ].pop().revert( 'all' )
      }
    } catch ( e ) {}
    return this
  }
})

return Han
})
