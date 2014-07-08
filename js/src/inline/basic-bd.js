define([
  '../method',
  '../farr',
  '../regex/typeset'
], function( $, Farr, TYPESET ) {

function renderBasicBd( context ) {
  var
    context = context || document,
    farr, mid
  ;

  if ( support.unicoderange ) {
    return
  }

  farr = Farr( context )
  farr.filteredElemList += ' em'

  mid = $.create( 'char', 'biaodian cjk middle' )
  mid.setAttribute( 'unicode', 'b7' )

  farr
  .wrap( /\u00B7/g, $.clone( mid ))
  .charify({
    liga:      'liga',
    hanzi:     'none',
    word:      'none',
    latin:     'none',
    ellinika:  'none',
    kirillica: 'none'
  })
}

return renderBasicBd
})
