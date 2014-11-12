;(function ( global ) {

	var vlq = { encode: encode, decode: decode },
		charToInteger,
		integerToChar;

	charToInteger = {};
	integerToChar = {};
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split( '' ).forEach( function ( char, i ) {
		charToInteger[ char ] = i;
		integerToChar[ i ] = char;
	});

	function encode ( value ) {
		var result;

		if ( typeof value === 'number' ) {
			result = encodeInteger( value );
		} else if ( Array.isArray( value ) ) {
			result = '';
			value.forEach( function ( num ) {
				result += encodeInteger( num );
			});
		} else {
			throw new Error( 'vlq.encode accepts an integer or an array of integers' );
		}

		return result;
	}

	function encodeInteger ( num ) {
		var result = '', clamped;

		if ( num < 0 ) {
			num = ( -num << 1 ) | 1;
		} else {
			num <<= 1;
		}

		do {
			clamped = num & 31;
			num >>= 5;

			if ( num > 0 ) {
				clamped |= 32;
			}

			result += integerToChar[ clamped ];
		} while ( num > 0 );

		return result;
	}

	function decode ( string ) {
		var result = [],
			len = string.length,
			i,
			hasContinuationBit,
			shift = 0,
			value = 0;

		for ( i = 0; i < len; i += 1 ) {
			integer = charToInteger[ string[i] ];

			if ( integer === undefined ) {
				throw new Error( 'Invalid character (' + string[i] + ')' );
			}

			hasContinuationBit = integer & 32;

			integer &= 31;
			value += integer << shift;

			if ( hasContinuationBit ) {
				shift += 5;
			} else {
				shouldNegate = value & 1;
				value >>= 1;

				result.push( shouldNegate ? -value : value );

				// reset
				value = shift = 0;
			}
		}

		return result;
	}

	// Export as AMD
	if ( typeof define === 'function' && define.amd ) {
		define( vlq );
	} else if ( typeof module !== 'undefined' ) {
		module.exports = vlq;
	} else {
		global.vlq = vlq;
	}

}( typeof window !== 'undefined' ? window : this ));
