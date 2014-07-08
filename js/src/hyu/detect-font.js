define([
  '../method',
  '../var/body'
], function( $, body ) {

function writeOnCanvas( text, font ) {
  var
    canvas = $.create( 'canvas' ),
    context
  ;

  canvas.width = '50'
  canvas.height = '20'
  canvas.style.display = 'none'

  body.appendChild( canvas )

  context = canvas.getContext('2d')
  context.textBaseline = 'top'
  context.font = '15px ' + font + ', sans-serif'
  context.fillStyle = 'black'
  context.strokeStyle = 'black'
  context.fillText( text, 0, 0 )

  return [ canvas, context ]
}

function detectFont( treat, control, text ) {
  var
    treat = treat,
    control = control,
    text = text || '辭Q',
    ret
  ;

  try {
    control = writeOnCanvas( text, control || 'sans-serif' )
    treat = writeOnCanvas( text, treat )

    for ( var j = 1; j <= 20; j++ ) {
      for ( var i = 1; i <= 50; i++ ) {
        if (
          ret !== 'undefined' &&
          treat[1].getImageData(i, j, 1, 1).data[3] !==
            control[1].getImageData(i, j, 1, 1).data[3]
        ) {
          ret = true
          break
        } else if ( ret ) {
          break
        }

        if ( i === 50 && j === 20 && !ret ) {
          ret = false
        }
      }
    }

    // Remove and clean from memory
    control[0].parentNode.removeChild( control[0] )
    treat[0].parentNode.removeChild( treat[0] )
    control = null
    treat = null

    return ret
  } catch ( err ) {
    return false
  }
}

return detectFont
})
