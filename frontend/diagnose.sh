#!/bin/bash

echo "🔍 TypeScript Diagnostic Tool"
echo "=============================="
echo

echo "📋 TypeScript Version Check:"
npx tsc --version
echo

echo "🔎 Running TypeScript Compiler for detailed errors:"
npx tsc --noEmit
echo

echo "📚 Checking React and React DOM versions:"
npm list react react-dom
echo

echo "🧩 Checking React and React DOM type definition versions:"
npm list @types/react @types/react-dom
echo

echo "⚠️ Potentially Incompatible Type Definitions:"
find src -name "*.d.ts" -type f | while read -r file; do
  echo "  - $file"
done
echo

echo "🔄 Check for circular dependencies:"
npx madge --circular --extensions ts,tsx src/
echo

echo "Diagnostic complete. Use the information above to resolve your TypeScript issues."