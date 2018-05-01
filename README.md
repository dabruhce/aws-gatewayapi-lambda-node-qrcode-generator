## AWS QR Code Generator
This project uses https://github.com/gera2ld/qrcanvas to generate QR codes.
Check that repo for the API and alter handler.js as needed.  All necessary
binaries for executing canvas are checked in to node_modules & lib. This allows
the following:

* alter/test changes locally by executing in a lambda docker container
* deploy directly with serverless framework to AWS gatewayapi + lambda
* steps included on how to test vs deployed endpoint


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
