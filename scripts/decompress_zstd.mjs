import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { constants, createZstdDecompress } from 'node:zlib';

try {
  await pipeline(
    createReadStream(process.argv[2]),
    createZstdDecompress({ params: { [constants.ZSTD_d_windowLogMax]: 27 } }),
    createWriteStream(process.argv[3]),
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
