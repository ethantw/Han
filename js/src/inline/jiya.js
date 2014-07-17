define([
  '../core',
  '../method',
  '../regex'
],
function( Han, $ ) {

Han.renderJiya = function( context ) {
  var
    context = context || document,
    finder = Han.find( context )
  ;

  finder.filteredElemList += ' textarea code kbd samp pre jinze em'

  finder
  .charify({
    hanzi:     'biaodian',
    liga:      'liga',
    word:      'none',
    latin:     'none',
    ellinika:  'none',
    kirillica: 'none'
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
