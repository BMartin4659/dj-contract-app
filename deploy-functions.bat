@echo off
echo Installing latest dependencies...
cd functions
npm install --save firebase-functions@latest
npm install --save dotenv
npm install

echo Deploying Firebase functions...
firebase deploy --only functions

echo Done!
pause 