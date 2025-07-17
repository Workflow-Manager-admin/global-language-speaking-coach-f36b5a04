#!/bin/bash
cd /home/kavia/workspace/code-generation/global-language-speaking-coach-f36b5a04/practice_app_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

