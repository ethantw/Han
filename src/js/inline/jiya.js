define([
  '../core',
  '../method',
  '../regex/unicode'
], function( Han, $, UNICODE ) {

Han.renderJiya = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-char-group' )
  .replace(
    // This is a safeguard against hanging rendering
    new RegExp( '(' + UNICODE.biaodian.end + '+)(' + UNICODE.biaodian.open + '+)', 'g' ),
    function( portion, match ) {
      if ( portion.index === 0 ) return portion.isEnd ? match[0] : match[1]

      var elem = $.create( 'h-char-group', 'biaodian cjk portion' )
      elem.innerHTML = match[2]
      return elem
    }
  )
  .endAvoid()

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-char' )
  .groupify({ biaodian:  true })
  .charify({  biaodian:  true })

  // The reason we're doing this instead of using pseudo elements in CSS
  // is because WebKit has problem rendering pseudo elements containing only 
  // space.
  $.qsa( 'h-char.biaodian.open, h-char.biaodian.end', context )
  .forEach(function( elem ) {
    if ( Han.find.matches( elem, 'h-cs *' ))  return
    var html = '<h-inner>' + elem.innerHTML + '</h-inner>'
    var hcs = '<h-cs hidden> </h-cs>'
    var isOpen = elem.classList.contains( 'open' )
    elem.innerHTML = isOpen ? hcs + html : html + hcs
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
