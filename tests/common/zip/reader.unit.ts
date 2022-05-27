import { expect } from 'chai';
import JSZip from 'jszip';
import { TextDecoder } from 'util';

import { ZipReader } from '../../../src/common/zip';

describe('ZipReader', () => {
  let zip: JSZip;

  const asyncArrayFrom = async <T>(iterator: AsyncIterableIterator<T>): Promise<T[]> => {
    const array: T[] = [];
    // eslint-disable-next-line no-restricted-syntax
    for await (const item of iterator) {
      array.push(item);
    }
    return array;
  };

  beforeEach(() => {
    zip = new JSZip();
    zip.file('file.json', JSON.stringify({ hello: 'world' }));
    zip.file('nested/file.zip', new JSZip().file('inside.json', JSON.stringify({ a: 1 })).generateNodeStream());
    zip.file('nested/other.json', JSON.stringify({ key: true }));
  });

  afterEach(() => {
    (zip as any) = undefined;
  });

  it('deeply reads all files, unzips internal zips', async () => {
    const reader = new ZipReader(zip);
    const files = await asyncArrayFrom(reader.getFiles());

    expect(files.length).to.equal(3);

    expect(files[0].name).to.equal('file.json');
    expect(new TextDecoder().decode(files[0].content)).to.equal(JSON.stringify({ hello: 'world' }));

    expect(files[1].name).to.equal('inside.json');
    expect(new TextDecoder().decode(files[1].content)).to.equal(JSON.stringify({ a: 1 }));

    expect(files[2].name).to.equal('nested/other.json');
    expect(new TextDecoder().decode(files[2].content)).to.equal(JSON.stringify({ key: true }));
  });

  it('throws if total size exceeds limit', async () => {
    const reader = new ZipReader(zip, {
      maxUnzipSizeBytes: 1,
    });
    expect(asyncArrayFrom(reader.getFiles())).to.eventually.throw(/^Total file size exceeded maximum/);
  });

  it('throws if total file count exceeds limit', async () => {
    const reader = new ZipReader(zip, {
      maxFileCount: 1,
    });
    expect(asyncArrayFrom(reader.getFiles())).to.eventually.throw(/^File count exceeded maximum/);
  });

  it('limits recursion to limit', async () => {
    const reader = new ZipReader(zip, { maxZipRecursionDepth: 0 });
    const files = await asyncArrayFrom(reader.getFiles());

    expect(files.length).to.equal(3);
    expect(files[0].name).to.equal('file.json');
    expect(files[1].name).to.equal('nested/file.zip');
    expect(files[2].name).to.equal('nested/other.json');
  });

  it('filters by path glob', async () => {
    const reader = new ZipReader(zip);
    const files = await asyncArrayFrom(reader.getFiles({ path: 'nested/*.json' }));

    expect(files.length).to.equal(1);
    expect(files[0].name).to.equal('nested/other.json');
  });
});
