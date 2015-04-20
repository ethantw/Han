define([
  '../var/body',
  '../method',
  './core'
], function( body, $, Locale ) {

function writeOnCanvas( text, font ) {
  var canvas = $.create( 'canvas' )
  var context

  canvas.width = '50'
  canvas.height = '20'
  canvas.style.display = 'none'

  body.appendChild( canvas )

  context = canvas.getContext( '2d' )
  context.textBaseline = 'top'
  context.font = '15px ' + font + ', sans-serif'
  context.fillStyle = 'black'
  context.strokeStyle = 'black'
  context.fillText( text, 0, 0 )

  return {
    node: canvas,
    context: context,
    remove: function() {
      $.remove( canvas, body )
    }
  }
}

function compareCanvases( treat, control ) {
  var ret
  var a = treat.context
  var b = control.context

  try {
    for ( var j = 1; j <= 20; j++ ) {
      for ( var i = 1; i <= 50; i++ ) {
        if (
          typeof ret === 'undefined' &&
          a.getImageData(i, j, 1, 1).data[3] !== b.getImageData(i, j, 1, 1).data[3]
        ) {
          ret = false
          break
        } else if ( typeof ret === 'boolean' ) {
          break
        }

        if ( i === 50 && j === 20 && typeof ret === 'undefined' ) {
          ret = true
        }
      }
    }

    // Remove and clean from memory
    treat.remove()
    control.remove()
    treat = null
    control = null

    return ret
  } catch (e) {}
  return false
}

function detectFont( treat, control, text ) {
  var treat = treat
  var control = control || 'sans-serif'
  var text = text || '辭Q'
  var ret

  control = writeOnCanvas( text, control )
  treat = writeOnCanvas( text, treat )

  return !compareCanvases( treat, control )
}

Locale.writeOnCanvas = writeOnCanvas
Locale.compareCanvases = compareCanvases
Locale.detectFont = detectFont

return Locale
})
