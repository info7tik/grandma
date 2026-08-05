#!/bin/bash

export ANDROID_HOME=$HOME/Android/Sdk

npm run build
npx cap sync android
pushd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
popd