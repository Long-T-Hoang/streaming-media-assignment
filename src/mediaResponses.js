const fs = require('fs');
const path = require('path');

const calcByteRange = (request, stats) => {
  let { range } = request.headers;

  if (!range) {
    range = 'bytes=0-';
  }

  const positions = range.replace(/bytes=/, '').split('-');

  let start = parseInt(positions[0], 10);

  const total = stats.size;
  const end = positions[1] ? parseInt(positions[1], 10) : total - 1;

  if (start > end) {
    start = end - 1;
  }

  const byteRange = { start, end, total };

  return byteRange;
};

const loadFile = (request, response, filePath, contentType) => {
  const file = path.resolve(__dirname, filePath);

  fs.stat(file, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        response.writeHead(404);
      }
      return response.end(err);
    }

    const byteRange = calcByteRange(request, stats);

    const chunksize = (byteRange.end - byteRange.start) + 1;

    response.writeHead(206, {
      'Content-Range': `bytes ${byteRange.start}-${byteRange.end}/${byteRange.total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });

    const range = { start: byteRange.start, end: byteRange.end };

    const stream = fs.createReadStream(file, range);

    stream.on('open', () => {
      stream.pipe(response);
    });

    stream.on('error', (streamErr) => {
      response.end(streamErr);
    });

    return stream;
  });
};

const getParty = (request, response) => {
  loadFile(request, response, '../client/party.mp4', 'video/mp4');
};

const getBling = (request, response) => {
  loadFile(request, response, '../client/bling.mp3', 'audio/mpeg');
};

const getBird = (request, response) => {
  loadFile(request, response, '../client/bird.mp4', 'video/mp4');
};

module.exports = {
  getParty,
  getBird,
  getBling,
};
