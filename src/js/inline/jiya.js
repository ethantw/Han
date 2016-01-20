define([
  '../core',
  '../method',
  '../regex/unicode',
  '../find'
], function( Han, $, UNICODE ) {

var csHTML  = '<h-cs hidden> </h-cs>'
var csoHTML = '<h-cs hidden class="jinze-outer"> </h-cs>'

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

    $elmt.innerHTML = $elmt.classList.contains( 'bd-open' )
      ? csHTML + html
      : html + csHTML
  })

  $.qsa( 'h-jinze', context )
  .forEach(function( $elmt ) {
    if (matches( $elmt, '.tou, .touwei' )) {
      $elmt.insertAdjacentHTML( 'beforebegin', csoHTML )
    }
    if (matches( $elmt, '.wei, .touwei' )) {
      $elmt.insertAdjacentHTML( 'afterend', csoHTML )
    }
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
