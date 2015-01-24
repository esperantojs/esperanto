var Promise = function () {};

Promise.prototype = {
	keep () { this.state = 'kept'; },
	break () { this.state = 'broken'; }
};

export default Promise;