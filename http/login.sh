#!/bin/bash

RESPONSE=$(curl -s -X POST https://api.nobleledger.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "mstoews@hotmail.com",
    "Password": "1628888",
    "returnSecureToken": true
  }')

TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['idToken'])")

echo "TOKEN=$TOKEN"
export TOKEN
