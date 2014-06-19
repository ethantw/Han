define([

], function() {
var
  Mer = function( selector ) {
    return new Mer.prototype.init( selector )
  }
;

Mer.prototype = {
  constructor: Mer,

  selector: '',

  init: function( selector ) {
    this.selector = selector
    return this
  }
}

Mer.prototype.init.prototype = Mer.prototype
return Mer
})
