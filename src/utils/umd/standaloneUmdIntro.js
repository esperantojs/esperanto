import { quote } from 'utils/mappers';

export default function standaloneUmdIntro ( options, indentStr ) {
	var amdName = options.amdName ?
		quote(options.amdName) + ", " :
		'';

	var intro =
`(function (factory) {
	!(typeof exports === 'object' && typeof module !== 'undefined') &&
	typeof define === 'function' && define.amd ? define(${amdName}factory) :
	factory()
}(function () { 'use strict';

`;

	return intro.replace( /\t/g, indentStr );
}
