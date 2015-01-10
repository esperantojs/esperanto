export function getId ( m ) {
	return m.id;
}

export function getName ( m ) {
	return m.name;
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