export function getId ( m ) {
	return m.id;
}

export function quote ( str ) {
	return "'" + str + "'";
}

export function req ( path ) {
	return 'require(\'' + path + '\')';
}

export function globalify ( name ) {
	return 'global.' + name;
}