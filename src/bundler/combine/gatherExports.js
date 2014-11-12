export default function gatherExports ( exports, toRewrite, prefix ) {
	exports.forEach( x => {
		if ( !x.specifiers ) {
			return;
		}

		x.specifiers.forEach( s => {
			toRewrite[ s.name ] = prefix + '__' + s.name;
		});
	});
}