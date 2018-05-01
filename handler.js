const fs = require('fs');
const qrcanvas = require('qrcanvas/dist/qrcanvas.node.js');

module.exports.endpoint = function(event, context, callback) {


const body = JSON.parse(event.body);
console.log(body.data.url)
const urlcreate = body.data.url;

const canvas = qrcanvas({
  data: urlcreate,
  size: 200,
  cellSize: 4,
  foreground: 'blue',
//  correctLevel: 'H',
  effect: {key: 'liquid', value: 1},
});

let dataUrl = canvas.toDataURL('image/png');
console.log(dataUrl);
  const response = {
    statusCode: 200,
    headers: {
     "X-Requested-With": '*',
     "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,x-requested-with',
     "Access-Control-Allow-Origin": '*',
     "Access-Control-Allow-Methods": 'GET'
    },
     body: dataUrl
  };

  callback(null, response);

}
