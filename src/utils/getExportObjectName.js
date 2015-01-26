export default function getExportObjectName( mod ) {
	var exportObjectName = 'exports';

	while ( mod.ast._scope.contains( exportObjectName ) ) {
		exportObjectName = `_${exportObjectName}`;
	}

	return exportObjectName;
}
