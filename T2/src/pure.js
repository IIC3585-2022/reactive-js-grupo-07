const _ = require("lodash");

const createMap = (imgs_obj, tile_size) => {
  // CEAR UNA FUNCION QUE ARME EL MAPA?
  const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  return function setCanvasSize(canvas) {
    canvas.width = map[0].length * tile_size;
    canvas.height = map.length * tile_size;

    return function draw(ctx) {
      _.forEach(map, (row, row_idx) => {
        _.map(row, (id, col_idx) => {
          ctx.drawImage(imgs_obj.id, col_idx, row_idx);
        });
      });
    };
  };
};

const _pipe = (op1, op2) => (arg) => op2(op1(arg));
const pipe = (...ops) => _.reduce(ops, _pipe);

async function getPathsJSON() {
  const response = await fetch("paths.json");
  const json = await response.json();
  return json;
}

const getImages = (json) => {
  var yellowDot = new Image();
  yellowDot.src = json.images.yellowDot.path;
  yellowDot.tagName = "yellowDot";
  var wall = new Image();
  wall.src = json.images.wall.path;
  wall.tagName = "wall";
  return { 0: wall, 1: yellowDot };
};

export { pipe, getPathsJSON, getImages, createMap };

// pipe: getPathsJSON > getImages(json) >
