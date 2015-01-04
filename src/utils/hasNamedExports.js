export default function hasNamedExports ( mod ) {
	var i;

	i = mod.exports.length;
	while ( i-- ) {
		if ( !mod.exports[i].isDefault ) {
			return true;
		}
	}
}
