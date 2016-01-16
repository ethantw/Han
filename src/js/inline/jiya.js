define([
  '../core',
  '../method',
  '../regex/unicode',
  '../find'
], function( Han, $, UNICODE ) {

var matches = Han.find.matches

function locateConsecutiveBd( portion ) {
  var $elmt = portion.node.parentNode

  while (!matches( $elmt, 'h-char.biaodian' )) {
    $elmt = $elmt.parentNode
  }

  $elmt.classList.add(
    'consecutive-bd',
    portion.index === 0
      ? 'is-first'
      : portion.isEnd
      ? 'is-end'
      : 'is-inner'
  )
  return portion.text
}

Han.renderJiya = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-cs' )

  //.groupify({ biaodian:  true })
  .charify({ biaodian: true })

  .replace( TYPESET.group.biaodian[0], locateConsecutiveBd )
  .replace( TYPESET.group.biaodian[1], locateConsecutiveBd )

  // The reason we’re doing this instead of using
  // pseudo elements in CSS is because WebKit has
  // problem rendering pseudo elements containing
  // only spaces.
  $.qsa( 'h-char.bd-open, h-char.bd-end', context )
  .forEach(function( $elmt ) {
    var html = '<h-inner>' + $elmt.innerHTML + '</h-inner>'
    var hcs = '<h-cs hidden> </h-cs>'

    $elmt.innerHTML = $elmt.classList.contains( 'bd-open' )
      ? hcs + html
      : html + hcs
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
      this.jiya.revert( 'all' )
    } catch ( e ) {}
    return this
  }
})

return Han
})
