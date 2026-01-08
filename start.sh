#!/bin/bash
PORT=${PORT:-3000}
exec npx serve -s dist -l $PORT --host 0.0.0.0
