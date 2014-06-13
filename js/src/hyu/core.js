define(function() {
  var
    Hyu = function( query ) {
      return Hyu.fn.init( query )
    }
  ;

  Hyu.fn = Hyu.prototype = {
    constructor: Hyu,

    selector: '',

    init: function( selector ) {
      this.selector = selector

      return this
    }
  }

  return Hyu
})
