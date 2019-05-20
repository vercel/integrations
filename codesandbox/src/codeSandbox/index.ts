import createSandbox from 'codesandbox-import-utils/lib/create-sandbox';
import { UIError } from '../types';
import { isText, isTooBig } from './isText';
import { RawFile, Uploads, Files } from './types';
import { uploadFiles, uploadSandbox } from './api';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_MODULE_COUNT = 120;
const MAX_DIRECTORY_COUNT = 50;

export async function parseFiles(filesArray: RawFile[]) {
  const binaryFiles = await Promise.all(
    filesArray.map(async ({ path, content }) => {
      const isBinary = !(await isText(path, content));
      return { path, content, isBinary };
    })
  );
  const result = binaryFiles.reduce<{ files: Files; uploads: Uploads }>(
    ({ files, uploads }, { path, isBinary, content }) => {
      if (isBinary) {
        if (content.byteLength > MAX_FILE_SIZE) {
          throw new UIError(`${path} ${isTooBig(content) ? 'Is too big' : 'Is a binary file'}`);
        }
        uploads[path] = content;
      } else {
        files[path] = {
          content: content.toString(),
          isBinary
        };
      }

      return { files, uploads };
    },
    {
      files: {},
      uploads: {}
    }
  );

  return result;
}

export async function parseSandbox(token: string, filesArray: RawFile[]) {
  const { files, uploads } = await parseFiles(filesArray);

  if (Object.keys(uploads).length) {
    const uploadedFiles = await uploadFiles(token, uploads);
    Object.assign(files, uploadedFiles);
  }

  const sandbox = await createSandbox(files);

  if (sandbox.modules.length > MAX_MODULE_COUNT) {
    throw new UIError(
      `Too many modules, the count ${
        sandbox.modules.length
      } exceeds the max of ${MAX_MODULE_COUNT}.`
    );
  }

  if (sandbox.directories.length > MAX_DIRECTORY_COUNT) {
    throw new UIError(
      `Too many directories, the count ${
        sandbox.directories.length
      } exceeds the max of ${MAX_DIRECTORY_COUNT}.`
    );
  }

  return sandbox;
}

export async function createCodeSandbox(token: string, filesArray: RawFile[]) {
  const sandboxOptions = await parseSandbox(token, filesArray);
  const sandbox = await uploadSandbox(token, sandboxOptions);

  return sandbox;
}
