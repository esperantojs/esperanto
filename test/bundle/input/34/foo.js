var exports = {};
exports.bar = function () {
	console.log( 'exports should be renamed' );
};

export default exports;