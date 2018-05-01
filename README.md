## QR
This repo has all the necessary binaries to execute canvas correctly within the lambda environment.

Everything is checked in to node_modules & lib.

This project uses https://github.com/gera2ld/qrcanvas to generate QR codes.
Check that repo for the API and alter handler.js as needed.


### run with docker locally
````text

docker run --rm -v "%cd%:/var/task" lambci/lambda:nodejs6.10 handler.endpoint "{\"data\": { \"url\": \"https://google.com\" } }"

````


### Deploy to AWS using serverless
````text
git clone https://github.com/tkntobfrk/aws-gatewayapi-lambda-node-qrcode-generator.git
cd aws-gatewayapi-lambda-node-qrcode-generator
npm i serverless -g
sls deploy
````


### Test vs deployed serverless endpoint
````text
curl -X POST -k https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/qr -d "{\"data\": { \"url\": \"https://google.com\" } } "

````
