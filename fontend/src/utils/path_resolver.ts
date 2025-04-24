import path from 'path';

export function pathResolver(...paths: string[]) {
	return path.join(...paths);
}

export function generateUniqueId() {
	return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


