import { join } from 'path';
import { File, DeploymentDir, UIError } from '../types';

const joinDir = (dir: string, path: string) => join(dir, path).replace(/\\/g, '/');

const ignored = [/node_modules/, /\.next/];

export function getFilesDeep(filesList: File[], dir: string = '') {
  return filesList.reduce<{ path: string; name: string; uid: string }[]>((files, file) => {
    const { name } = file;
    const path = joinDir(dir, name);

    // TODO: Allow the user to specify exclude globs per project
    if (ignored.some(regex => regex.test(name))) {
      return files;
    }

    if (file.type === 'file') {
      files.push({ path, name, uid: file.uid });
    } else if (file.type === 'directory') {
      files.push(...getFilesDeep(file.children, path));
    }

    return files;
  }, []);
}

export function filterRootFiles(filesList: File[]) {
  const isPackageJson = (f: File) => f.name === 'package.json' && f.type === 'file';
  const src = filesList.find(f => f.name === 'src' && f.type === 'directory') as
    | DeploymentDir
    | undefined;

  if (src) {
    const hasPackageJson = src.children.some(isPackageJson);

    // V2 Deployment
    if (hasPackageJson) {
      return src.children;
    }
  }

  // V1 Deployment
  if (filesList.some(isPackageJson)) {
    return filesList;
  }

  throw new UIError('Could not find package.json 📦');
}
